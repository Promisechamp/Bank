const { supabase } = require('./db/supabase');
const crypto = require('crypto');

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
  if (error || !data) throw new Error('Unable to load user profile');
  return data;
};

const addUserSocket = (userId, socketId) => {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSockets.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) userSockets.delete(userId);
};

const isUserOnline = (userId) => {
  const sockets = userSockets.get(userId);
  return Boolean(sockets && sockets.size > 0);
};

const emitToUser = (io, userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};

const getOnlineUsers = () => Array.from(userSockets.keys());

// ============================================================
// SOCKET SETUP
// ============================================================
const setupSocket = (io) => {
  // ==========================================================
  // AUTHENTICATION MIDDLEWARE
  // ==========================================================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: token required'));

      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        console.error('❌ Socket authentication failed:', error?.message);
        return next(new Error('Authentication error: invalid token'));
      }

      socket.userId = user.id;
      socket.userEmail = user.email;
      socket.user = user;

      try {
        socket.profile = await getProfile(user.id);
        socket.userRole = String(socket.profile.role || 'user').toLowerCase();
      } catch (profileError) {
        console.error('❌ Unable to load socket profile:', profileError.message);
        socket.userRole = 'user';
      }

      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // ==========================================================
  // CONNECTION
  // ==========================================================
  io.on('connection', (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    console.log(`🔌 User connected: ${userId} (${userRole})`);

    onlineUsers.set(socket.id, userId);
    addUserSocket(userId, socket.id);
    socket.join(`user:${userId}`);
    if (userRole === 'admin') socket.join('admins');
    io.emit('users:online', getOnlineUsers());

    // ========================================================
    // NOTIFICATIONS – READ
    // ========================================================
    socket.on('notification:read', async (notificationId) => {
      try {
        if (!notificationId) return;
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', userId);
      } catch (error) {
        console.error('❌ notification:read error:', error);
      }
    });

    // ========================================================
    // CHAT MESSAGE
    // ========================================================
    socket.on('chat:message', async (data, callback) => {
      try {
        const { conversationId, message } = data || {};
        if (!conversationId) throw new Error('conversationId is required');
        if (typeof message !== 'string' || !message.trim()) throw new Error('Message is required');

        const cleanMessage = message.trim();
        if (cleanMessage.length > 5000) throw new Error('Message cannot exceed 5000 characters');

        // Get conversation
        const { data: conversation, error: conversationError } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();
        if (conversationError || !conversation) throw new Error('Conversation not found');
        if (conversation.status !== 'active') throw new Error('This conversation is closed');

        let recipientId;
        if (userRole === 'admin') {
          if (conversation.admin_id !== userId) throw new Error('You are not assigned to this conversation');
          recipientId = conversation.user_id;
        } else {
          if (conversation.user_id !== userId) throw new Error('You do not have access to this conversation');
          if (!conversation.admin_id) throw new Error('An administrator has not been assigned to this conversation yet');
          recipientId = conversation.admin_id;
        }

        // Build new message
        const now = new Date().toISOString();
        const newMessage = {
          id: crypto.randomUUID(),
          sender_id: userId,
          sender_role: userRole,
          message: cleanMessage,
          created_at: now,
          read: false,
        };

        const currentMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
        const updatedMessages = [...currentMessages, newMessage];

        let userUnreadCount = Number(conversation.user_unread_count || 0);
        let adminUnreadCount = Number(conversation.admin_unread_count || 0);
        if (userRole === 'admin') userUnreadCount += 1;
        else adminUnreadCount += 1;

        // Save to DB
        const { data: updatedConversation, error: updateError } = await supabase
          .from('chat_conversations')
          .update({
            messages: updatedMessages,
            last_message_at: now,
            user_unread_count: userUnreadCount,
            admin_unread_count: adminUnreadCount,
          })
          .eq('id', conversationId)
          .eq('status', 'active')
          .select('*')
          .single();

        if (updateError) {
          console.error('❌ Chat database update error:', updateError);
          throw new Error('Unable to save message');
        }

        // ------------------------------------------------------------------
        // 1. Broadcast the message to the recipient
        // ------------------------------------------------------------------
        emitToUser(io, recipientId, 'chat:message', {
          conversationId,
          message: newMessage,
        });

        // ------------------------------------------------------------------
        // 2. Confirm to sender
        // ------------------------------------------------------------------
        emitToUser(io, userId, 'chat:message:sent', {
          conversationId,
          message: newMessage,
        });

        // ------------------------------------------------------------------
        // 3. Send a push notification to the recipient (if online)
        //    using the existing sendNotification helper.
        // ------------------------------------------------------------------
        const senderName = socket.profile?.full_name || 'Someone';
        sendNotification(io, recipientId, {
          type: 'new_message',
          conversationId,
          message: newMessage,
          senderId: userId,
          senderName,
          // optionally include other metadata
        });

        // ------------------------------------------------------------------
        // 4. Acknowledge to client
        // ------------------------------------------------------------------
        if (typeof callback === 'function') {
          callback({
            success: true,
            message: newMessage,
            conversation: updatedConversation,
          });
        }
      } catch (error) {
        console.error('❌ chat:message error:', error);
        if (typeof callback === 'function') {
          callback({
            success: false,
            message: error.message || 'Unable to send message',
          });
        }
      }
    });

    // ========================================================
    // TYPING
    // ========================================================
    socket.on('chat:typing', async (data) => {
      // (unchanged, omitted for brevity)
    });

    // ========================================================
    // CHAT READ
    // ========================================================
    socket.on('chat:read', async (data, callback) => {
      // (unchanged, omitted for brevity)
    });

    // ========================================================
    // CLOSE CONVERSATION
    // ========================================================
    socket.on('chat:close', async (data, callback) => {
      // (unchanged, omitted for brevity)
    });

    // ========================================================
    // DISCONNECT
    // ========================================================
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${userId} (${reason})`);
      onlineUsers.delete(socket.id);
      removeUserSocket(userId, socket.id);
      io.emit('users:online', getOnlineUsers());
    });
  });

  return io;
};

// ============================================================
// SEND NOTIFICATION (exported helper)
// ============================================================
const sendNotification = (io, userId, notification) => {
  if (!io || !userId || !notification) {
    console.warn('⚠️ sendNotification: missing required parameters');
    return;
  }
  io.to(`user:${userId}`).emit('notification:new', notification);
};

module.exports = {
  setupSocket,
  sendNotification,
  isUserOnline,
  getOnlineUsers,
  userSockets,
  onlineUsers,
};