// controllers/notificationController.js
const { supabase } = require('../db/supabase');
const { createAndSendNotification } = require('../utils/notifications');

// We'll store `io` globally (set in server.js) or pass via req.app.get('io')
// For simplicity, assume you attach io to app.locals or export from server.

/**
 * GET /api/notifications
 * Fetch paginated notifications for the authenticated user
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware
    const { limit = 20, offset = 0, unreadOnly = 'false' } = req.query;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly === 'true') {
      query = query.eq('read', false);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, count });
  } catch (error) {
    console.error('❌ getNotifications error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('❌ markAsRead error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('❌ markAllAsRead error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/notifications (admin only)
 * Send a system notification to a user
 * Body: { userId, title, message, type? }
 */
exports.sendSystemNotification = async (req, res) => {
  try {
    const { userId, title, message, type = 'system' } = req.body;
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const io = req.app.get('io'); // make sure you set this in server.js
    const notification = await createAndSendNotification(
      io,
      userId,
      type,
      title,
      message,
      null
    );

    if (!notification) {
      return res.status(500).json({ error: 'Failed to create notification' });
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('❌ sendSystemNotification error:', error);
    res.status(500).json({ error: error.message });
  }
};


/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('❌ deleteNotification error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/notifications
 * Delete all notifications (optionally filter by read status)
 * Query: ?readOnly=true (deletes only read notifications)
 */
exports.deleteNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ids } = req.body;
    const { deleteAll, readOnly } = req.query;

    let query = supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (deleteAll === 'true') {
      // Delete all (optionally only read ones)
      if (readOnly === 'true') {
        query = query.eq('read', true);
      }
    } else {
      // Delete specific IDs (batch)
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'No IDs provided' });
      }
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) throw error;
    res.json({ success: true, message: 'Notifications deleted' });
  } catch (error) {
    console.error('Delete notifications error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};