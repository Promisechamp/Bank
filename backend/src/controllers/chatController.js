const { supabase } = require('../db/supabase');
const crypto = require('crypto');

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
    .select('id, email, full_name, role, status')
    .eq('id', userId)
    .single();
  if (error) throw new Error('Unable to load user profile');
  return data;
};

const ensureChatUser = async (userId) => {
  const profile = await getProfile(userId);
  if (!profile) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }
  if (
    profile.status &&
    ['banned', 'disabled', 'deleted'].includes(String(profile.status).toLowerCase())
  ) {
    const error = new Error('Your account cannot use chat');
    error.statusCode = 403;
    throw error;
  }
  return profile;
};

const ensureAdmin = async (userId) => {
  const profile = await ensureChatUser(userId);
  if (String(profile.role).toLowerCase() !== 'admin') {
    const error = new Error('Administrator access required');
    error.statusCode = 403;
    throw error;
  }
  return profile;
};

const getConversation = async (conversationId) => {
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  if (error || !data) {
    const err = new Error('Conversation not found');
    err.statusCode = 404;
    throw err;
  }
  return data;
};

// This helper now only checks regular user access.
// Admin checks are handled separately in each endpoint.
const ensureConversationParticipant = (conversation, userId, role) => {
  const normalizedRole = String(role).toLowerCase();
  // For non‑admin, require user_id match
  if (normalizedRole !== 'admin') {
    if (conversation.user_id !== userId) {
      const error = new Error('You do not have access to this conversation');
      error.statusCode = 403;
      throw error;
    }
  }
  // For admin, we skip the check here – let the endpoint decide.
};

const getMessages = (conversation) => {
  if (!Array.isArray(conversation.messages)) return [];
  return conversation.messages;
};

// ============================================================
// CREATE CONVERSATION
// ============================================================
const createConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await ensureChatUser(userId);
    if (String(profile.role).toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators cannot create user conversations.',
      });
    }
    const subject =
      typeof req.body?.subject === 'string'
        ? req.body.subject.trim().slice(0, 200)
        : null;
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        admin_id: null,
        status: 'active',
        subject: subject || null,
        messages: [],
        user_unread_count: 0,
        admin_unread_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) {
      console.error('createConversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to create conversation.',
      });
    }
    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully.',
      conversation: data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// START NEW CONVERSATION
// ============================================================
const startNewConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await ensureChatUser(userId);
    if (String(profile.role).toLowerCase() === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Administrators cannot start user conversations.',
      });
    }
    const subject =
      typeof req.body?.subject === 'string'
        ? req.body.subject.trim().slice(0, 200)
        : null;
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: userId,
        admin_id: null,
        status: 'active',
        subject: subject || null,
        messages: [],
        user_unread_count: 0,
        admin_unread_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select('*')
      .single();
    if (error) {
      console.error('startNewConversation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to start a new conversation.',
      });
    }
    return res.status(201).json({
      success: true,
      message: 'New conversation started.',
      conversation: data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET USER CONVERSATIONS
// ============================================================
const getUserConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await ensureChatUser(userId);
    const { data, error } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false });
    if (error) {
      console.error('getUserConversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to load conversations.',
      });
    }
    return res.json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE CONVERSATION – ALLOW ADMIN TO VIEW ANY
// ============================================================
const getConversationById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const profile = await ensureChatUser(userId);
    const role = String(profile.role).toLowerCase();

    const conversation = await getConversation(conversationId);

    // Admin can view any conversation; non‑admin must be the owner
    if (role !== 'admin') {
      if (conversation.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this conversation.',
        });
      }
    }

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN — GET CONVERSATIONS
// ============================================================
const getAdminConversations = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    await ensureAdmin(adminId);

    const requestedStatus = String(req.query.status || 'active').toLowerCase();
    let query = supabase
      .from('chat_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (requestedStatus === 'active' || requestedStatus === 'closed') {
      query = query.eq('status', requestedStatus);
    }
    const { data, error } = await query;
    if (error) {
      console.error('getAdminConversations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to load chat conversations.',
      });
    }
    return res.json({
      success: true,
      conversations: data || [],
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ADMIN — CLAIM CONVERSATION
// ============================================================
const claimConversation = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    await ensureAdmin(adminId);
    const { conversationId } = req.params;
    const conversation = await getConversation(conversationId);
    if (conversation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Closed conversations cannot be claimed.',
      });
    }
    if (conversation.admin_id && conversation.admin_id !== adminId) {
      return res.status(409).json({
        success: false,
        message: 'This conversation is already assigned to another admin.',
      });
    }
    const { data, error } = await supabase
      .from('chat_conversations')
      .update({ admin_id: adminId })
      .eq('id', conversationId)
      .is('admin_id', null)
      .eq('status', 'active')
      .select('*')
      .single();
    if (error || !data) {
      return res.status(409).json({
        success: false,
        message: 'Unable to claim conversation. It may already be assigned.',
      });
    }
    return res.json({
      success: true,
      message: 'Conversation assigned successfully.',
      conversation: data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// SEND MESSAGE – AUTO‑ASSIGN ADMIN IF UNASSIGNED
// ============================================================
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const profile = await ensureChatUser(userId);
    const messageText = normalizeMessage(req.body?.message);
    if (!messageText) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be between 1 and 5000 characters.',
      });
    }
    const conversation = await getConversation(conversationId);
    if (conversation.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This conversation is closed. Start a new conversation to continue chatting.',
      });
    }

    const role = String(profile.role).toLowerCase();

    // ---- Admin handling ----
    if (role === 'admin') {
      // If conversation has no admin_id, auto‑assign this admin
      if (!conversation.admin_id) {
        const { data: updated, error: updateErr } = await supabase
          .from('chat_conversations')
          .update({ admin_id: userId })
          .eq('id', conversationId)
          .select('*')
          .single();
        if (!updateErr && updated) {
          conversation.admin_id = userId; // update local object
        } else {
          console.error('Auto-assign error:', updateErr);
          // Continue anyway (message will be sent, but admin_id stays null)
        }
      }
      // If conversation is assigned to a different admin, block
      if (conversation.admin_id && conversation.admin_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'This conversation is assigned to another admin.',
        });
      }
    } else {
      // ---- User handling ----
      if (conversation.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this conversation.',
        });
      }
    }

    const now = new Date().toISOString();
    const newMessage = {
      id: generateMessageId(),
      sender_id: userId,
      sender_role: role,
      message: messageText,
      created_at: now,
      read: false,
    };
    const messages = getMessages(conversation);
    const updatedMessages = [...messages, newMessage];

    let userUnreadCount = conversation.user_unread_count || 0;
    let adminUnreadCount = conversation.admin_unread_count || 0;
    if (role === 'admin') {
      userUnreadCount += 1;
    } else {
      adminUnreadCount += 1;
    }

    const { data, error } = await supabase
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

    if (error) {
      console.error('sendMessage error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to send message.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      chatMessage: newMessage,
      conversation: data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// MARK CHAT AS READ – ADMIN CAN MARK ANY
// ============================================================
const markConversationRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const profile = await ensureChatUser(userId);
    const role = String(profile.role).toLowerCase();
    const conversation = await getConversation(conversationId);

    // Admin can mark any conversation; regular user must be the owner
    if (role !== 'admin' && conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation.',
      });
    }

    const update = role === 'admin' ? { admin_unread_count: 0 } : { user_unread_count: 0 };
    const { data, error } = await supabase
      .from('chat_conversations')
      .update(update)
      .eq('id', conversationId)
      .select('*')
      .single();
    if (error) {
      console.error('markConversationRead error:', error);
      return res.status(500).json({
        success: false,
        message: 'Unable to mark conversation as read.',
      });
    }
    return res.json({
      success: true,
      conversation: data,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CLOSE CONVERSATION – ADMIN CAN CLOSE ANY
// ============================================================
const closeConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const profile = await ensureChatUser(userId);
    const role = String(profile.role).toLowerCase();
    const conversation = await getConversation(conversationId);

    // Admin can close any; regular user must be the owner
    if (role !== 'admin' && conversation.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this conversation.',
      });
    }

    if (conversation.status === 'closed') {
      return res.json({
        success: true,
        message: 'Conversation is already closed.',
        conversation,
      });
    }

    const { data, error } = await supabase
      .from('chat_conversations')
      .update({ status: 'closed' })
      .eq('id', conversationId)
      .eq('status', 'active')
      .select('*')
      .single();

    if (error || !data) {
      return res.status(409).json({
        success: false,
        message: 'Unable to close conversation.',
      });
    }

    return res.json({
      success: true,
      message: 'Conversation closed successfully.',
      conversation: data,
    });
  } catch (error) {
    next(error);
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
  claimConversation,
  sendMessage,
  markConversationRead,
  closeConversation,
};