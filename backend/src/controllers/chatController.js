const { supabase } = require('../db/supabase');
const crypto = require('crypto');
const {
  createAndSendNotification,
} = require('../utils/notifications');

// ============================================================
// HELPERS
// ============================================================

const generateMessageId = () => crypto.randomUUID();

const normalizeMessage = (message) => {
  if (typeof message !== 'string') return null;

  const cleaned = message.trim();

  if (!cleaned) return null;
  if (cleaned.length > 5000) return null;

  return cleaned;
};

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, role, status'
    )
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(
      'Unable to load user profile'
    );
  }

  return data;
};

const ensureChatUser = async (userId) => {
  const profile = await getProfile(userId);

  if (!profile) {
    const error = new Error(
      'User profile not found'
    );

    error.statusCode = 404;

    throw error;
  }

  if (
    profile.status &&
    ['banned', 'disabled', 'deleted'].includes(
      String(profile.status).toLowerCase()
    )
  ) {
    const error = new Error(
      'Your account cannot use chat'
    );

    error.statusCode = 403;

    throw error;
  }

  return profile;
};

const ensureAdmin = async (userId) => {
  const profile =
    await ensureChatUser(userId);

  if (
    String(profile.role).toLowerCase() !==
    'admin'
  ) {
    const error = new Error(
      'Administrator access required'
    );

    error.statusCode = 403;

    throw error;
  }

  return profile;
};

const getConversation = async (
  conversationId
) => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error || !data) {
    const err = new Error(
      'Conversation not found'
    );

    err.statusCode = 404;

    throw err;
  }

  return data;
};

const getMessages = (conversation) => {
  if (
    !Array.isArray(
      conversation?.messages
    )
  ) {
    return [];
  }

  return conversation.messages;
};

// ============================================================
// PROFILE ENRICHMENT
//
// chat_conversations stores IDs.
// Profiles stores full_name.
//
// We explicitly fetch the profiles and attach them to the
// conversation response.
//
// Result:
//
// user_profile: {
//   id,
//   full_name,
//   email,
//   role
// }
//
// admin_profile: {
//   id,
//   full_name,
//   email,
//   role
// }
//
// customer_name:
//   actual customer's full_name
// ============================================================

const enrichConversation = async (
  conversation
) => {
  if (!conversation) {
    return null;
  }

  const userId =
    conversation.user_id || null;

  const adminId =
    conversation.admin_id || null;

  let userProfile = null;
  let adminProfile = null;

  // ----------------------------------------------------------
  // CUSTOMER / USER PROFILE
  // ----------------------------------------------------------

  if (userId) {
    const { data, error } =
      await supabase
        .from('profiles')
        .select(
          'id, full_name, email, role, status'
        )
        .eq('id', userId)
        .maybeSingle();

    if (error) {
      console.error(
        '[Chat] Unable to load customer profile:',
        error
      );
    } else {
      userProfile = data || null;
    }
  }

  // ----------------------------------------------------------
  // ADMIN PROFILE
  // ----------------------------------------------------------

  if (adminId) {
    const { data, error } =
      await supabase
        .from('profiles')
        .select(
          'id, full_name, email, role, status'
        )
        .eq('id', adminId)
        .maybeSingle();

    if (error) {
      console.error(
        '[Chat] Unable to load admin profile:',
        error
      );
    } else {
      adminProfile = data || null;
    }
  }

  const customerName =
    userProfile?.full_name ||
    userProfile?.email ||
    'Customer';

  return {
    ...conversation,

    // Explicit profile objects.
    user_profile: userProfile,
    admin_profile: adminProfile,

    // Easy fields for conversation-list UI.
    customer_name: customerName,
    customer_email:
      userProfile?.email || null,

    admin_name:
      adminProfile?.full_name ||
      adminProfile?.email ||
      null,

    admin_email:
      adminProfile?.email || null,
  };
};

const enrichConversations = async (
  conversations
) => {
  if (!Array.isArray(conversations)) {
    return [];
  }

  /*
   * Load all required profile IDs once instead of
   * making 2 queries per conversation.
   */

  const userIds = [
    ...new Set(
      conversations
        .map(
          (conversation) =>
            conversation.user_id
        )
        .filter(Boolean)
    ),
  ];

  const adminIds = [
    ...new Set(
      conversations
        .map(
          (conversation) =>
            conversation.admin_id
        )
        .filter(Boolean)
    ),
  ];

  const allProfileIds = [
    ...new Set([
      ...userIds,
      ...adminIds,
    ]),
  ];

  let profiles = [];

  if (allProfileIds.length) {
    const { data, error } =
      await supabase
        .from('profiles')
        .select(
          'id, full_name, email, role, status'
        )
        .in('id', allProfileIds);

    if (error) {
      console.error(
        '[Chat] Unable to load conversation profiles:',
        error
      );
    } else {
      profiles = data || [];
    }
  }

  const profileMap = new Map(
    profiles.map((profile) => [
      String(profile.id),
      profile,
    ])
  );

  return conversations.map(
    (conversation) => {
      const userProfile =
        conversation.user_id
          ? profileMap.get(
              String(
                conversation.user_id
              )
            ) || null
          : null;

      const adminProfile =
        conversation.admin_id
          ? profileMap.get(
              String(
                conversation.admin_id
              )
            ) || null
          : null;

      const customerName =
        userProfile?.full_name ||
        userProfile?.email ||
        'Customer';

      return {
        ...conversation,

        user_profile:
          userProfile,

        admin_profile:
          adminProfile,

        customer_name:
          customerName,

        customer_email:
          userProfile?.email ||
          null,

        admin_name:
          adminProfile?.full_name ||
          adminProfile?.email ||
          null,

        admin_email:
          adminProfile?.email ||
          null,
      };
    }
  );
};

// ============================================================
// FETCH ALL ACTIVE ADMINS
// ============================================================

const getAllAdmins = async () => {
  const { data, error } =
    await supabase
      .from('profiles')
      .select(
        'id, full_name, email'
      )
      .eq('role', 'admin')
      .eq('status', 'active');

  if (error) {
    console.error(
      'Failed to fetch admins:',
      error
    );

    return [];
  }

  return data || [];
};

// ============================================================
// CREATE CONVERSATION
// ============================================================

const createConversation = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    const profile =
      await ensureChatUser(userId);

    if (
      String(profile.role).toLowerCase() ===
      'admin'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Administrators cannot create user conversations.',
      });
    }

    const subject =
      typeof req.body?.subject ===
      'string'
        ? req.body.subject
            .trim()
            .slice(0, 200)
        : null;

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,

        // No claiming / assignment required.
        admin_id: null,

        status: 'active',

        subject:
          subject || null,

        messages: [],

        user_unread_count: 0,

        admin_unread_count: 0,

        last_message_at:
          new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'createConversation error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to create conversation.',
      });
    }

    const conversation =
      await enrichConversation(data);

    // ----------------------------------------------------------
    // NOTIFY ALL ADMINS
    // ----------------------------------------------------------

    const io = req.app.get('io');

    const admins =
      await getAllAdmins();

    const senderName =
      profile.full_name ||
      profile.email ||
      'Customer';

    for (const admin of admins) {
      await createAndSendNotification(
        io,
        admin.id,
        'system',
        'New Support Request',
        `${senderName} has started a new conversation.`,
        data.id
      );
    }

    return res.status(201).json({
      success: true,
      message:
        'Conversation created successfully.',
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// START NEW CONVERSATION
// ============================================================

const startNewConversation = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    const profile =
      await ensureChatUser(userId);

    if (
      String(profile.role).toLowerCase() ===
      'admin'
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Administrators cannot start user conversations.',
      });
    }

    const subject =
      typeof req.body?.subject ===
      'string'
        ? req.body.subject
            .trim()
            .slice(0, 200)
        : null;

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        admin_id: null,
        status: 'active',
        subject:
          subject || null,
        messages: [],
        user_unread_count: 0,
        admin_unread_count: 0,
        last_message_at:
          new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'startNewConversation error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to start a new conversation.',
      });
    }

    const conversation =
      await enrichConversation(data);

    // ----------------------------------------------------------
    // NOTIFY ALL ADMINS
    // ----------------------------------------------------------

    const io = req.app.get('io');

    const admins =
      await getAllAdmins();

    const senderName =
      profile.full_name ||
      profile.email ||
      'Customer';

    for (const admin of admins) {
      await createAndSendNotification(
        io,
        admin.id,
        'system',
        'New Support Request',
        `${senderName} has started a new conversation.`,
        data.id
      );
    }

    return res.status(201).json({
      success: true,
      message:
        'New conversation started.',
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER CONVERSATIONS
// ============================================================

const getUserConversations = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    await ensureChatUser(userId);

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'getUserConversations error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to load conversations.',
      });
    }

    const conversations =
      await enrichConversations(
        data || []
      );

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE CONVERSATION
// ============================================================

const getConversationById = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.user.id;

    const {
      conversationId,
    } = req.params;

    const profile =
      await ensureChatUser(userId);

    const role =
      String(
        profile.role
      ).toLowerCase();

    const conversation =
      await getConversation(
        conversationId
      );

    if (
      role !== 'admin' &&
      conversation.user_id !== userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have access to this conversation.',
      });
    }

    const enrichedConversation =
      await enrichConversation(
        conversation
      );

    return res.json({
      success: true,
      conversation:
        enrichedConversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN — GET CONVERSATIONS
// ============================================================

const getAdminConversations = async (
  req,
  res,
  next
) => {
  try {
    const adminId = req.user.id;

    await ensureAdmin(adminId);

    const requestedStatus =
      String(
        req.query.status ||
          'active'
      ).toLowerCase();

    let query =
      supabase
        .from('chat_conversations')
        .select('*')
        .order(
          'last_message_at',
          {
            ascending: false,
          }
        );

    if (
      requestedStatus === 'active' ||
      requestedStatus === 'closed'
    ) {
      query = query.eq(
        'status',
        requestedStatus
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        'getAdminConversations error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to load chat conversations.',
      });
    }

    const conversations =
      await enrichConversations(
        data || []
      );

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SEND MESSAGE
// ============================================================

const sendMessage = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user.id;

    const {
      conversationId,
    } = req.params;

    const profile =
      await ensureChatUser(
        userId
      );

    const messageText =
      normalizeMessage(
        req.body?.message
      );

    if (!messageText) {
      return res.status(400).json({
        success: false,
        message:
          'Message is required and must be between 1 and 5000 characters.',
      });
    }

    const conversation =
      await getConversation(
        conversationId
      );

    if (
      conversation.status !==
      'active'
    ) {
      return res.status(400).json({
        success: false,
        message:
          'This conversation is closed. Start a new conversation to continue chatting.',
      });
    }

    const role =
      String(
        profile.role
      ).toLowerCase();

    // ----------------------------------------------------------
    // ADMIN
    //
    // IMPORTANT:
    // An admin can reply to ANY active conversation.
    //
    // No claim.
    // No assignment requirement.
    // ----------------------------------------------------------

    if (role === 'admin') {
      // Nothing else required.
    }

    // ----------------------------------------------------------
    // CUSTOMER
    // ----------------------------------------------------------

    else {
      if (
        conversation.user_id !==
        userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            'You do not have access to this conversation.',
        });
      }
    }

    const now =
      new Date().toISOString();

    const senderName =
      profile.full_name ||
      profile.email ||
      'Customer';

    const newMessage = {
      id: generateMessageId(),

      sender_id: userId,

      sender_role: role,

      sender_name:
        senderName,

      sender_full_name:
        profile.full_name ||
        null,

      sender_email:
        profile.email ||
        null,

      message:
        messageText,

      created_at: now,

      read: false,
    };

    const messages =
      getMessages(
        conversation
      );

    const updatedMessages = [
      ...messages,
      newMessage,
    ];

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

    if (role === 'admin') {
      userUnreadCount += 1;
    } else {
      adminUnreadCount += 1;
    }

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
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

    if (error) {
      console.error(
        'sendMessage error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to send message.',
      });
    }

    // ----------------------------------------------------------
    // NOTIFICATIONS
    // ----------------------------------------------------------

    const io =
      req.app.get('io');

    if (role === 'admin') {
      // Notify customer.
      await createAndSendNotification(
        io,
        conversation.user_id,
        'system',
        `New message from ${senderName}`,
        messageText.slice(
          0,
          100
        ) +
          (messageText.length >
          100
            ? '...'
            : ''),
        conversationId
      );
    } else {
      /*
       * If a conversation has an existing admin_id,
       * notify that admin.
       *
       * Otherwise notify ALL active admins.
       *
       * No claiming is performed.
       */

      if (conversation.admin_id) {
        await createAndSendNotification(
          io,
          conversation.admin_id,
          'system',
          `New message from ${senderName}`,
          messageText.slice(
            0,
            100
          ) +
            (messageText.length >
            100
              ? '...'
              : ''),
          conversationId
        );
      } else {
        const admins =
          await getAllAdmins();

        for (const admin of admins) {
          await createAndSendNotification(
            io,
            admin.id,
            'system',
            `New message from ${senderName}`,
            messageText.slice(
              0,
              100
            ) +
              (messageText.length >
              100
                ? '...'
                : ''),
            conversationId
          );
        }
      }
    }

    const enrichedConversation =
      await enrichConversation(
        data
      );

    return res.status(201).json({
      success: true,

      message:
        'Message sent successfully.',

      chatMessage:
        newMessage,

      conversation:
        enrichedConversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// MARK CHAT AS READ
// ============================================================

const markConversationRead = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user.id;

    const {
      conversationId,
    } = req.params;

    const profile =
      await ensureChatUser(
        userId
      );

    const role =
      String(
        profile.role
      ).toLowerCase();

    const conversation =
      await getConversation(
        conversationId
      );

    if (
      role !== 'admin' &&
      conversation.user_id !==
        userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have access to this conversation.',
      });
    }

    const update =
      role === 'admin'
        ? {
            admin_unread_count: 0,
          }
        : {
            user_unread_count: 0,
          };

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
      .update(update)
      .eq(
        'id',
        conversationId
      )
      .select('*')
      .single();

    if (error) {
      console.error(
        'markConversationRead error:',
        error
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to mark conversation as read.',
      });
    }

    const enrichedConversation =
      await enrichConversation(
        data
      );

    return res.json({
      success: true,
      conversation:
        enrichedConversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CLOSE CONVERSATION
// ============================================================

const closeConversation = async (
  req,
  res,
  next
) => {
  try {
    const userId =
      req.user.id;

    const {
      conversationId,
    } = req.params;

    const profile =
      await ensureChatUser(
        userId
      );

    const role =
      String(
        profile.role
      ).toLowerCase();

    const conversation =
      await getConversation(
        conversationId
      );

    if (
      role !== 'admin' &&
      conversation.user_id !==
        userId
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You do not have access to this conversation.',
      });
    }

    if (
      conversation.status ===
      'closed'
    ) {
      const enriched =
        await enrichConversation(
          conversation
        );

      return res.json({
        success: true,
        message:
          'Conversation is already closed.',
        conversation:
          enriched,
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from('chat_conversations')
      .update({
        status: 'closed',
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
      error ||
      !data
    ) {
      return res.status(409).json({
        success: false,
        message:
          'Unable to close conversation.',
      });
    }

    // ----------------------------------------------------------
    // NOTIFY OTHER PARTICIPANT
    // ----------------------------------------------------------

    const io =
      req.app.get('io');

    let otherUserId =
      null;

    if (role === 'admin') {
      otherUserId =
        conversation.user_id;
    } else {
      otherUserId =
        conversation.admin_id;
    }

    if (otherUserId) {
      const closerName =
        profile.full_name ||
        profile.email ||
        'Customer';

      await createAndSendNotification(
        io,
        otherUserId,
        'system',
        'Conversation Closed',
        `${closerName} has closed this conversation.`,
        conversationId
      );
    }

    const enrichedConversation =
      await enrichConversation(
        data
      );

    return res.json({
      success: true,
      message:
        'Conversation closed successfully.',
      conversation:
        enrichedConversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE CONVERSATION
// Admin only
// ============================================================

const deleteConversation = async (
  req,
  res
) => {
  try {
    const userId =
      req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required.',
      });
    }

    // Always verify the actual profile role.
    const profile =
      await ensureAdmin(
        userId
      );

    const {
      conversationId,
    } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message:
          'Conversation ID is required.',
      });
    }

    // ----------------------------------------------------------
    // VERIFY CONVERSATION EXISTS
    // ----------------------------------------------------------

    const {
      data: conversation,
      error: findError,
    } = await supabase
      .from('chat_conversations')
      .select(
        'id, user_id, admin_id, status'
      )
      .eq(
        'id',
        conversationId
      )
      .maybeSingle();

    if (findError) {
      console.error(
        '[Chat] Delete conversation lookup error:',
        findError
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to find conversation.',
      });
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message:
          'Conversation not found.',
      });
    }

    // ----------------------------------------------------------
    // DELETE
    // ----------------------------------------------------------

    const {
      error: deleteError,
    } = await supabase
      .from('chat_conversations')
      .delete()
      .eq(
        'id',
        conversationId
      );

    if (deleteError) {
      console.error(
        '[Chat] Delete conversation error:',
        deleteError
      );

      return res.status(500).json({
        success: false,
        message:
          'Unable to delete conversation.',
      });
    }

    return res.status(200).json({
      success: true,
      message:
        'Conversation deleted successfully.',
      conversationId,
    });
  } catch (error) {
    console.error(
      '[Chat] Delete conversation exception:',
      error
    );

    const statusCode =
      error?.statusCode || 500;

    return res.status(
      statusCode
    ).json({
      success: false,
      message:
        error?.message ||
        'An unexpected error occurred while deleting the conversation.',
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createConversation,
  startNewConversation,
  getUserConversations,
  getConversationById,
  getAdminConversations,
  sendMessage,
  markConversationRead,
  closeConversation,
  deleteConversation,
};