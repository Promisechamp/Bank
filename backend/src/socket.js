// socket.js

const { supabase } = require('./db/supabase');
const crypto = require('crypto');
const { createAndSendNotification } = require('./utils/notifications');

// ============================================================
// ONLINE USERS
// ============================================================

const onlineUsers = new Map();
const userSockets = new Map();

// ============================================================
// HELPERS
// ============================================================

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('Unable to load user profile');
  }

  return data;
};

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);

  if (!sockets) return;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
  }
};

const isUserOnline = (userId) => {
  const sockets = userSockets.get(userId);

  return Boolean(
    sockets && sockets.size > 0
  );
};

const getOnlineUsers = () => {
  return Array.from(userSockets.keys());
};

// ============================================================
// EMIT TO ONE USER
// ============================================================

const emitToUser = (
  io,
  userId,
  event,
  payload
) => {
  if (!io) {
    console.error(
      '❌ Cannot emit: io is missing'
    );

    return false;
  }

  if (!userId) {
    console.error(
      '❌ Cannot emit: userId is missing'
    );

    return false;
  }

  const room = `user:${userId}`;

  const sockets =
    io.sockets.adapter.rooms.get(room);

  console.log('📡 EMIT TO USER');
  console.log('Event:', event);
  console.log('User ID:', userId);
  console.log('Room:', room);
  console.log(
    'Connected sockets:',
    sockets ? [...sockets] : []
  );
  console.log(
    'Socket count:',
    sockets?.size || 0
  );

  if (!sockets || sockets.size === 0) {
    console.warn(
      `⚠️ No active socket in room ${room}`
    );

    return false;
  }

  io.to(room).emit(
    event,
    payload
  );

  console.log(
    `✅ ${event} delivered to ${sockets.size} socket(s)`
  );

  return true;
};

// ============================================================
// GET ALL ACTIVE ADMINS
// ============================================================

const getAllAdmins = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .eq('status', 'active');

  if (error) {
    console.error(
      '❌ Failed to fetch admins:',
      error
    );

    return [];
  }

  return data || [];
};

// ============================================================
// SOCKET SETUP
// ============================================================

const setupSocket = (io) => {
  // ==========================================================
  // AUTHENTICATION
  // ==========================================================

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        return next(
          new Error(
            'Authentication error: token required'
          )
        );
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(
        token
      );

      if (error || !user) {
        console.error(
          '❌ Socket authentication failed:',
          error?.message
        );

        return next(
          new Error(
            'Authentication error: invalid token'
          )
        );
      }

      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.user = user;

      try {
        socket.profile =
          await getProfile(user.id);

        socket.userRole = String(
          socket.profile.role || 'user'
        ).toLowerCase();
      } catch (profileError) {
        console.error(
          '❌ Unable to load socket profile:',
          profileError.message
        );

        socket.userRole = 'user';
      }

      next();
    } catch (error) {
      console.error(
        '❌ Socket authentication error:',
        error
      );

      next(
        new Error(
          'Authentication error'
        )
      );
    }
  });

  // ==========================================================
  // CONNECTION
  // ==========================================================

  io.on('connection', (socket) => {
    const userId =
      socket.userId;

    const userRole =
      socket.userRole;

    console.log(
      `🔌 User connected: ${userId} (${userRole})`
    );

    // --------------------------------------------------------
    // Track socket
    // --------------------------------------------------------

    onlineUsers.set(
      socket.id,
      userId
    );

    addUserSocket(
      userId,
      socket.id
    );

    // --------------------------------------------------------
    // Personal room
    // --------------------------------------------------------

    socket.join(
      `user:${userId}`
    );

    // --------------------------------------------------------
    // Admin room
    // --------------------------------------------------------

    if (userRole === 'admin') {
      socket.join('admins');
    }

    console.log(
      '================================='
    );

    console.log(
      '🟢 SOCKET READY'
    );

    console.log(
      'User ID:',
      userId
    );

    console.log(
      'Role:',
      userRole
    );

    console.log(
      'Socket ID:',
      socket.id
    );

    console.log(
      'Room:',
      `user:${userId}`
    );

    console.log(
      'Rooms:',
      [...socket.rooms]
    );

    console.log(
      '================================='
    );

    io.emit(
      'users:online',
      getOnlineUsers()
    );

    // ========================================================
    // NOTIFICATION READ
    // ========================================================

    socket.on(
      'notification:read',
      async (notificationId) => {
        try {
          if (!notificationId) {
            return;
          }

          await supabase
            .from('notifications')
            .update({
              read: true,
            })
            .eq(
              'id',
              notificationId
            )
            .eq(
              'user_id',
              userId
            );
        } catch (error) {
          console.error(
            '❌ notification:read error:',
            error
          );
        }
      }
    );

    // ========================================================
    // CHAT MESSAGE
    // ========================================================

    socket.on(
      'chat:message',
      async (data, callback) => {
        try {
          const {
            conversationId,
            message,
          } = data || {};

          // --------------------------------------------------
          // Validate
          // --------------------------------------------------

          if (!conversationId) {
            throw new Error(
              'conversationId is required'
            );
          }

          if (
            typeof message !== 'string' ||
            !message.trim()
          ) {
            throw new Error(
              'Message is required'
            );
          }

          const cleanMessage =
            message.trim();

          if (
            cleanMessage.length > 5000
          ) {
            throw new Error(
              'Message cannot exceed 5000 characters'
            );
          }

          // --------------------------------------------------
          // Load conversation
          // --------------------------------------------------

          const {
            data: conversation,
            error: conversationError,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .select('*')
            .eq(
              'id',
              conversationId
            )
            .single();

          if (
            conversationError ||
            !conversation
          ) {
            throw new Error(
              'Conversation not found'
            );
          }

          // --------------------------------------------------
          // Closed conversations cannot receive messages
          // --------------------------------------------------

          if (
            conversation.status !==
            'active'
          ) {
            throw new Error(
              'This conversation is closed'
            );
          }

          // --------------------------------------------------
          // ACCESS CONTROL
          // --------------------------------------------------
          //
          // ADMIN:
          //   Can reply to ANY active conversation.
          //
          // USER:
          //   Can only reply to their own conversation.
          //
          // Assignment is NOT used as a permission check.
          // --------------------------------------------------

          let recipientId = null;

          if (
            userRole === 'admin'
          ) {
            // ================================================
            // ADMIN → USER
            // ================================================

            if (
              !conversation.user_id
            ) {
              throw new Error(
                'Conversation has no user'
              );
            }

            // IMPORTANT:
            // We intentionally DO NOT check admin_id here.
            //
            // Any admin can reply.
            recipientId =
              conversation.user_id;
          } else {
            // ================================================
            // USER → ADMIN
            // ================================================

            if (
              conversation.user_id !==
              userId
            ) {
              throw new Error(
                'You do not have access to this conversation'
              );
            }

            // If assigned, send to that admin.
            //
            // If NOT assigned, we will send to
            // every active admin below.

            recipientId =
              conversation.admin_id ||
              null;
          }

          // --------------------------------------------------
          // Create canonical message
          // --------------------------------------------------

          const now =
            new Date().toISOString();

          const newMessage = {
            id: crypto.randomUUID(),

            sender_id: userId,

            sender_role: userRole,

            message: cleanMessage,

            created_at: now,

            read: false,
          };

          // --------------------------------------------------
          // Existing messages
          // --------------------------------------------------

          const currentMessages =
            Array.isArray(
              conversation.messages
            )
              ? conversation.messages
              : [];

          const updatedMessages = [
            ...currentMessages,
            newMessage,
          ];

          // --------------------------------------------------
          // Unread counts
          // --------------------------------------------------

          let userUnreadCount =
            Number(
              conversation.user_unread_count ||
                0
            );

          let adminUnreadCount =
            Number(
              conversation.admin_unread_count ||
                0
            );

          if (
            userRole === 'admin'
          ) {
            userUnreadCount += 1;
          } else {
            adminUnreadCount += 1;
          }

          // --------------------------------------------------
          // Save message
          // --------------------------------------------------

          const {
            data: updatedConversation,
            error: updateError,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .update({
              messages:
                updatedMessages,

              last_message_at:
                now,

              user_unread_count:
                userUnreadCount,

              admin_unread_count:
                adminUnreadCount,
            })
            .eq(
              'id',
              conversationId
            )
            .eq(
              'status',
              'active'
            )
            .select('*')
            .single();

          if (
            updateError ||
            !updatedConversation
          ) {
            console.error(
              '❌ Chat database update error:',
              updateError
            );

            throw new Error(
              'Unable to save message'
            );
          }

          // ==================================================
          // DELIVER MESSAGE
          // ==================================================

          if (
            userRole === 'admin'
          ) {
            // ================================================
            // ADMIN → CLIENT
            // ================================================

            emitToUser(
              io,
              recipientId,
              'chat:message',
              {
                conversationId,
                message:
                  newMessage,
              }
            );
          } else {
            // ================================================
            // CLIENT → ADMIN
            // ================================================

            if (recipientId) {
              // ----------------------------------------------
              // ASSIGNED
              // ----------------------------------------------

              emitToUser(
                io,
                recipientId,
                'chat:message',
                {
                  conversationId,
                  message:
                    newMessage,
                }
              );
            } else {
              // ----------------------------------------------
              // UNASSIGNED
              //
              // Send to ALL active admins.
              // ----------------------------------------------

              const admins =
                await getAllAdmins();

              for (const admin of admins) {
                emitToUser(
                  io,
                  admin.id,
                  'chat:message',
                  {
                    conversationId,
                    message:
                      newMessage,
                  }
                );
              }
            }
          }

          // ==================================================
          // CONFIRM MESSAGE TO SENDER
          // ==================================================
          //
          // This is the ONLY event ChatContext should use
          // to add the sender's own canonical message.
          //
          // DO NOT create an optimistic message on frontend.
          // ==================================================

          emitToUser(
            io,
            userId,
            'chat:message:sent',
            {
              conversationId,
              message:
                newMessage,
            }
          );

          // ==================================================
          // NOTIFICATIONS
          // ==================================================

          const senderName =
            socket.profile?.full_name ||
            (
              userRole === 'admin'
                ? 'Admin'
                : 'User'
            );

          if (
            userRole === 'admin'
          ) {
            // ------------------------------------------------
            // ADMIN → USER
            // ------------------------------------------------

            if (recipientId) {
              await createAndSendNotification(
                io,
                recipientId,
                'system',
                `New message from ${senderName}`,
                cleanMessage.length > 100
                  ? cleanMessage.slice(
                      0,
                      97
                    ) + '...'
                  : cleanMessage,
                conversationId
              );
            }
          } else {
            // ------------------------------------------------
            // USER → ADMIN
            // ------------------------------------------------

            if (recipientId) {
              // Assigned admin

              await createAndSendNotification(
                io,
                recipientId,
                'system',
                `New message from ${senderName}`,
                cleanMessage.length > 100
                  ? cleanMessage.slice(
                      0,
                      97
                    ) + '...'
                  : cleanMessage,
                conversationId
              );
            } else {
              // Unassigned:
              // notify every active admin

              const admins =
                await getAllAdmins();

              for (
                const admin of admins
              ) {
                await createAndSendNotification(
                  io,
                  admin.id,
                  'system',
                  `New message from ${senderName}`,
                  cleanMessage.length > 100
                    ? cleanMessage.slice(
                        0,
                        97
                      ) + '...'
                    : cleanMessage,
                  conversationId
                );
              }
            }
          }

          // ==================================================
          // SUCCESS ACK
          // ==================================================

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: true,

              message:
                newMessage,

              conversation:
                updatedConversation,
            });
          }
        } catch (error) {
          console.error(
            '❌ chat:message error:',
            error
          );

          // --------------------------------------------------
          // FAILURE ACK
          // --------------------------------------------------

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: false,

              message:
                error.message ||
                'Unable to send message',
            });
          }
        }
      }
    );

    // ========================================================
    // TYPING
    // ========================================================

    socket.on(
      'chat:typing',
      async (data) => {
        try {
          const {
            conversationId,
            isTyping,
          } = data || {};

          if (!conversationId) {
            return;
          }

          const {
            data: conversation,
            error,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .select(
              'user_id, admin_id'
            )
            .eq(
              'id',
              conversationId
            )
            .single();

          if (
            error ||
            !conversation
          ) {
            return;
          }

          let targetUserId = null;

          if (
            userRole === 'admin'
          ) {
            targetUserId =
              conversation.user_id;
          } else {
            targetUserId =
              conversation.admin_id;
          }

          if (targetUserId) {
            emitToUser(
              io,
              targetUserId,
              'chat:typing',
              {
                conversationId,
                userId,
                isTyping:
                  !!isTyping,
              }
            );
          }
        } catch (error) {
          console.error(
            '❌ chat:typing error:',
            error
          );
        }
      }
    );

    // ========================================================
    // CHAT READ
    // ========================================================

    socket.on(
      'chat:read',
      async (data, callback) => {
        try {
          const {
            conversationId,
          } = data || {};

          if (!conversationId) {
            throw new Error(
              'conversationId is required'
            );
          }

          const {
            data: conversation,
            error: convError,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .select('*')
            .eq(
              'id',
              conversationId
            )
            .single();

          if (
            convError ||
            !conversation
          ) {
            throw new Error(
              'Conversation not found'
            );
          }

          // --------------------------------------------------
          // Admins can read any conversation.
          // --------------------------------------------------

          if (
            userRole === 'admin'
          ) {
            await supabase
              .from(
                'chat_conversations'
              )
              .update({
                admin_unread_count: 0,
              })
              .eq(
                'id',
                conversationId
              );
          } else {
            // User can only read own conversation

            if (
              conversation.user_id !==
              userId
            ) {
              throw new Error(
                'Not your conversation'
              );
            }

            await supabase
              .from(
                'chat_conversations'
              )
              .update({
                user_unread_count: 0,
              })
              .eq(
                'id',
                conversationId
              );
          }

          // --------------------------------------------------
          // Mark messages read
          // --------------------------------------------------

          const messages =
            Array.isArray(
              conversation.messages
            )
              ? conversation.messages
              : [];

          const updatedMessages =
            messages.map(
              (msg) => ({
                ...msg,
                read: true,
              })
            );

          await supabase
            .from(
              'chat_conversations'
            )
            .update({
              messages:
                updatedMessages,
            })
            .eq(
              'id',
              conversationId
            );

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: true,
            });
          }
        } catch (error) {
          console.error(
            '❌ chat:read error:',
            error
          );

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: false,

              message:
                error.message,
            });
          }
        }
      }
    );

    // ========================================================
    // CLOSE CONVERSATION
    // ========================================================

    socket.on(
      'chat:close',
      async (data, callback) => {
        try {
          const {
            conversationId,
          } = data || {};

          if (!conversationId) {
            throw new Error(
              'conversationId is required'
            );
          }

          const {
            data: conversation,
            error: convError,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .select('*')
            .eq(
              'id',
              conversationId
            )
            .single();

          if (
            convError ||
            !conversation
          ) {
            throw new Error(
              'Conversation not found'
            );
          }

          // --------------------------------------------------
          // Admin can close any conversation.
          // User can close their own.
          // --------------------------------------------------

          if (
            userRole === 'admin'
          ) {
            // Admin is allowed.
          } else {
            if (
              conversation.user_id !==
              userId
            ) {
              throw new Error(
                'Not your conversation'
              );
            }
          }

          const {
            error: updateError,
          } = await supabase
            .from(
              'chat_conversations'
            )
            .update({
              status: 'closed',
            })
            .eq(
              'id',
              conversationId
            );

          if (updateError) {
            throw new Error(
              'Failed to close conversation'
            );
          }

          // --------------------------------------------------
          // Notify other participant
          // --------------------------------------------------

          const otherUserId =
            userRole === 'admin'
              ? conversation.user_id
              : conversation.admin_id;

          if (otherUserId) {
            emitToUser(
              io,
              otherUserId,
              'chat:closed',
              {
                conversationId,
              }
            );
          }

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: true,
            });
          }
        } catch (error) {
          console.error(
            '❌ chat:close error:',
            error
          );

          if (
            typeof callback ===
            'function'
          ) {
            callback({
              success: false,

              message:
                error.message,
            });
          }
        }
      }
    );

    // ========================================================
    // DISCONNECT
    // ========================================================

    socket.on(
      'disconnect',
      (reason) => {
        console.log(
          `🔌 User disconnected: ${userId} (${reason})`
        );

        onlineUsers.delete(
          socket.id
        );

        removeUserSocket(
          userId,
          socket.id
        );

        io.emit(
          'users:online',
          getOnlineUsers()
        );
      }
    );
  });

  return io;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  setupSocket,
  isUserOnline,
  getOnlineUsers,
  userSockets,
  onlineUsers,
};