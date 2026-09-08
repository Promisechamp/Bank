const { supabase } = require('../db/supabase');
const crypto = require('crypto');
const { createAndSendNotification } = require('../utils/notifications');


const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, status')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  return data || null;
};


/*
|--------------------------------------------------------------------------
| Allowed values (unchanged)
|--------------------------------------------------------------------------
*/
const TRACKING_STATUSES = [
  'order_placed', 'payment_pending', 'payment_confirmed', 'processing',
  'personalized', 'ready_to_ship', 'shipped', 'in_transit',
  'out_for_delivery', 'delivered', 'cancelled', 'failed',
];
const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'];
const PAYMENT_STATUSES = ['pending', 'confirmed', 'failed', 'refunded'];

/*
|--------------------------------------------------------------------------
| Helper
|--------------------------------------------------------------------------
*/
const getUserId = (req) => req.user?.id || req.user?.user_id;

const createTrackingEvent = ({ status, location, message }) => ({
  id: crypto.randomUUID(),
  status,
  location: location || null,
  message: message || null,
  timestamp: new Date().toISOString(),
});

/*
|--------------------------------------------------------------------------
| USER – GET MY CARD TRACKING
| GET /api/card-tracking/mine
|--------------------------------------------------------------------------
*/
const getMyCardTracking = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { data, error } = await supabase
      .from('track_card')
      .select(`
        id, order_id, card_type, card_brand, card_last_four,
        order_status, payment_status, payment_currency, card_fee,
        shipping_address, shipping_city, shipping_state, shipping_country,
        carrier, tracking_number, tracking_status,
        current_location, current_message,
        ordered_at, payment_confirmed_at, processing_at,
        shipped_at, estimated_delivery_date, delivered_at,
        tracking_history, created_at, updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, cards: data || [] });
  } catch (error) {
    console.error('getMyCardTracking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load card tracking.' });
  }
};

/*
|--------------------------------------------------------------------------
| USER – GET SINGLE MY CARD BY ORDER ID
| GET /api/card-tracking/:orderId
|--------------------------------------------------------------------------
*/
const getMyCardTrackingByOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { orderId } = req.params;

    const { data, error } = await supabase
      .from('track_card')
      .select(`
        id, order_id, card_type, card_brand, card_last_four,
        order_status, payment_status, payment_currency, card_fee,
        shipping_address, shipping_city, shipping_state, shipping_country,
        carrier, tracking_number, tracking_status,
        current_location, current_message,
        ordered_at, payment_confirmed_at, processing_at,
        shipped_at, estimated_delivery_date, delivered_at,
        tracking_history, created_at, updated_at
      `)
      .eq('user_id', userId)
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: 'Card order not found.' });
    }

    return res.json({ success: true, card: data });
  } catch (error) {
    console.error('getMyCardTrackingByOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load card tracking.' });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN – GET ALL CARD TRACKING (with user info)
| GET /api/admin/card-tracking
|--------------------------------------------------------------------------
*/
const getAllCardTracking = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('track_card')
      .select(`
        *,
        profiles:user_id ( full_name, email )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten the joined profile data
    const cards = (data || []).map((card) => ({
      ...card,
      full_name: card.profiles?.full_name || null,
      email: card.profiles?.email || null,
      profiles: undefined,
    }));

    return res.json({ success: true, cards });
  } catch (error) {
    console.error('getAllCardTracking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load card tracking records.' });
  }
};

/*
|--------------------------------------------------------------------------
| ADMIN – GET SINGLE CARD BY ID
| GET /api/admin/card-tracking/:id
|--------------------------------------------------------------------------
*/
const getCardTrackingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('track_card')
      .select(`
        *,
        profiles:user_id ( full_name, email )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: 'Card tracking record not found.' });
    }

    const card = {
      ...data,
      full_name: data.profiles?.full_name || null,
      email: data.profiles?.email || null,
      profiles: undefined,
    };

    return res.json({ success: true, card });
  } catch (error) {
    console.error('getCardTrackingById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load card tracking record.' });
  }
};

/*
|--------------------------------------------------------------------------
| USER – CREATE CARD ORDER
| POST /api/card-tracking
|--------------------------------------------------------------------------
*/
const createCardOrder = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const orderId = req.body.order_id || `ORD-${crypto.randomUUID()}`;

    const newOrder = {
      user_id: userId,
      order_id: orderId,
      card_type: req.body.card_type || 'debit',
      card_brand: req.body.card_brand || null,
      card_fee: req.body.card_fee || 0,
      payment_currency: req.body.payment_currency || 'USDT',
      shipping_address: req.body.shipping_address,
      shipping_city: req.body.shipping_city,
      shipping_state: req.body.shipping_state,
      shipping_postal_code: req.body.shipping_postal_code,
      shipping_country: req.body.shipping_country,
      order_status: req.body.order_status || 'pending',
      payment_status: req.body.payment_status || 'pending',
      tracking_status: req.body.tracking_status || 'order_placed',
      tracking_history: req.body.tracking_events || [],
      metadata: {
        cardholder_name: req.body.cardholder_name || '',
        currency: req.body.currency || 'USD',
      },
    };

    const { data, error } = await supabase
      .from('track_card')
      .insert([newOrder])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Order ID already exists.' });
      }
      throw error;
    }

    // --- Send notification to the user ---
    const io = req.app.get('io');
    const userProfile = await getUserProfile(userId);
    const userEmail = userProfile?.email;
    const userName = userProfile?.full_name || 'User';

    await createAndSendNotification(
      io,
      userId,
      'system',
      'Card Order Placed',
      `Your card order #${data.order_id} has been placed successfully.`,
      data.id, // reference_id
      {
        template: 'card_order_update',
        userName,
        orderId: data.order_id,
        status: data.order_status,
        description: 'Your card order has been placed and is being processed.',
        // You can add more fields if your template expects them
      }
    );

    return res.status(201).json({ success: true, card: data });
  } catch (error) {
    console.error('createCardOrder error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



/*
|--------------------------------------------------------------------------
| ADMIN – CREATE CARD TRACKING RECORD (full control)
| POST /api/admin/card-tracking
|--------------------------------------------------------------------------
*/
const createCardTracking = async (req, res) => {
  try {
    const {
      user_id, order_id, card_id, card_type = 'debit', card_brand, card_last_four,
      order_status = 'pending', payment_status = 'pending', payment_currency,
      card_fee = 0, payment_reference,
      shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country,
      carrier, tracking_number,
      tracking_status = 'order_placed', current_location, current_message,
      estimated_delivery_date, notes, metadata = {},
    } = req.body;

    if (!user_id || !order_id) {
      return res.status(400).json({ success: false, message: 'user_id and order_id are required.' });
    }

    if (!shipping_address || !shipping_city || !shipping_state || !shipping_postal_code || !shipping_country) {
      return res.status(400).json({ success: false, message: 'Complete shipping information is required.' });
    }

    if (!TRACKING_STATUSES.includes(tracking_status)) {
      return res.status(400).json({ success: false, message: 'Invalid tracking status.' });
    }
    if (!ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }
    if (!PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    }

    const initialEvent = {
      id: crypto.randomUUID(),
      status: tracking_status,
      location: current_location || null,
      message: current_message || 'Card order created.',
      timestamp: new Date().toISOString(),
    };

    const newRecord = {
      user_id,
      order_id,
      card_id: card_id || null,
      card_type,
      card_brand: card_brand || null,
      card_last_four: card_last_four || null,
      order_status,
      payment_status,
      payment_currency: payment_currency || null,
      card_fee,
      payment_reference: payment_reference || null,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      shipping_country,
      carrier: carrier || null,
      tracking_number: tracking_number || null,
      tracking_status,
      current_location: current_location || null,
      current_message: current_message || null,
      estimated_delivery_date: estimated_delivery_date || null,
      tracking_history: [initialEvent],
      notes: notes || null,
      metadata,
    };

    const { data, error } = await supabase
      .from('track_card')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ success: false, message: 'Order ID already exists.' });
      }
      throw error;
    }

    // --- Notify the user ---
    const io = req.app.get('io');
    const userProfile = await getUserProfile(user_id);
    const userEmail = userProfile?.email;
    const userName = userProfile?.full_name || 'User';

    await createAndSendNotification(
      io,
      user_id,
      'system',
      'Card Order Created',
      `Your card order #${data.order_id} has been created by an administrator.`,
      data.id,
      {
        template: 'card_order_update',
        userName,
        orderId: data.order_id,
        status: data.order_status,
        description: 'Your card order has been created.',
      }
    );

    return res.status(201).json({ success: true, message: 'Card tracking record created.', card: data });
  } catch (error) {
    console.error('createCardTracking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create card tracking record.' });
  }
};



/*
|--------------------------------------------------------------------------
| ADMIN – UPDATE CARD TRACKING
| PUT /api/admin/card-tracking/:id
|--------------------------------------------------------------------------
*/
const updateCardTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      order_status, payment_status, payment_reference,
      carrier, tracking_number,
      tracking_status, current_location, current_message,
      estimated_delivery_date,
      processing_at, shipped_at, delivered_at,
      notes, metadata,
    } = req.body;

    if (tracking_status && !TRACKING_STATUSES.includes(tracking_status)) {
      return res.status(400).json({ success: false, message: 'Invalid tracking status.' });
    }
    if (order_status && !ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status.' });
    }
    if (payment_status && !PAYMENT_STATUSES.includes(payment_status)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status.' });
    }

    // Fetch existing record to preserve history and get user_id
    const { data: existing, error: fetchError } = await supabase
      .from('track_card')
      .select('tracking_history, tracking_status, current_location, current_message, user_id, order_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Card tracking record not found.' });
    }

    let history = Array.isArray(existing.tracking_history) ? existing.tracking_history : [];

    // Add event if status/location/message changed
    if (tracking_status || current_location !== undefined || current_message !== undefined) {
      const event = {
        id: crypto.randomUUID(),
        status: tracking_status || existing.tracking_status,
        location: current_location !== undefined ? current_location : existing.current_location,
        message: current_message !== undefined ? current_message : existing.current_message,
        timestamp: new Date().toISOString(),
      };
      history.push(event);
    }

    const updates = {
      order_status: order_status || undefined,
      payment_status: payment_status || undefined,
      payment_reference: payment_reference || undefined,
      carrier: carrier || undefined,
      tracking_number: tracking_number || undefined,
      tracking_status: tracking_status || undefined,
      current_location: current_location !== undefined ? current_location : undefined,
      current_message: current_message !== undefined ? current_message : undefined,
      estimated_delivery_date: estimated_delivery_date || undefined,
      processing_at: processing_at || undefined,
      shipped_at: shipped_at || undefined,
      delivered_at: delivered_at || undefined,
      notes: notes || undefined,
      metadata: metadata || undefined,
      tracking_history: history,
      updated_at: new Date().toISOString(),
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) delete updates[key];
    });

    const { data, error } = await supabase
      .from('track_card')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // --- Send notification to the user if status changed ---
    if (tracking_status || order_status) {
      const io = req.app.get('io');
      const userProfile = await getUserProfile(existing.user_id);
      const userName = userProfile?.full_name || 'User';
      const statusMsg = tracking_status || order_status;
      await createAndSendNotification(
        io,
        existing.user_id,
        'system',
        `Card Order Update: ${statusMsg}`,
        `Your card order #${existing.order_id} status changed to ${statusMsg}.`,
        id,
        {
          template: 'card_order_update',
          userName,
          orderId: existing.order_id,
          status: statusMsg,
          description: `Status updated to ${statusMsg}.`,
        }
      );
    }

    return res.json({ success: true, message: 'Card tracking updated.', card: data });
  } catch (error) {
    console.error('updateCardTracking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update card tracking.' });
  }
};



/*
|--------------------------------------------------------------------------
| ADMIN – DELETE CARD TRACKING
| DELETE /api/admin/card-tracking/:id
|--------------------------------------------------------------------------
*/
const deleteCardTracking = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('track_card')
      .delete()
      .eq('id', id)
      .select('id, order_id')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: 'Card tracking record not found.' });
    }

    return res.json({ success: true, message: 'Card tracking record deleted.', deleted: data });
  } catch (error) {
    console.error('deleteCardTracking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete card tracking record.' });
  }
};



/*
|--------------------------------------------------------------------------
| ADMIN – ADD TRACKING EVENT
| POST /api/admin/card-tracking/:id/events
|--------------------------------------------------------------------------
*/
const addTrackingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, title, description, location, timestamp } = req.body;

    if (!status && !title) {
      return res.status(400).json({
        success: false,
        message: 'At least status or title is required.',
      });
    }

    // Fetch existing record (to get user_id and order_id)
    const { data: existing, error: fetchError } = await supabase
      .from('track_card')
      .select('tracking_history, user_id, order_id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Card tracking record not found.',
      });
    }

    const newEvent = {
      id: crypto.randomUUID(),
      status: status || null,
      title: title || null,
      description: description || null,
      location: location || null,
      timestamp: timestamp || new Date().toISOString(),
    };

    const history = Array.isArray(existing.tracking_history) ? existing.tracking_history : [];
    history.push(newEvent);

    const { data, error } = await supabase
      .from('track_card')
      .update({ tracking_history: history, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // --- Notify the user ---
    const io = req.app.get('io');
    const userProfile = await getUserProfile(existing.user_id);
    const userName = userProfile?.full_name || 'User';
    const eventTitle = title || status || 'New tracking event';
    await createAndSendNotification(
      io,
      existing.user_id,
      'system',
      `Card Tracking: ${eventTitle}`,
      `New update for order #${existing.order_id}: ${eventTitle}`,
      id,
      {
        template: 'card_order_update',
        userName,
        orderId: existing.order_id,
        status: status || 'update',
        description: eventTitle,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Tracking event added.',
      card: data,
    });
  } catch (error) {
    console.error('addTrackingEvent error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add tracking event.',
    });
  }
};



module.exports = {
  getMyCardTracking,
  getMyCardTrackingByOrder,
  getAllCardTracking,
  getCardTrackingById,
  createCardOrder,
  createCardTracking,
  updateCardTracking,
  deleteCardTracking,
		addTrackingEvent
};