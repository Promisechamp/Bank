const express = require('express');
const { authenticate } = require('../middleware/auth');   // <-- import

const {
  getMyCardTracking,
  getMyCardTrackingByOrder,
  getAllCardTracking,
  getCardTrackingById,
  createCardOrder,
  createCardTracking,
  updateCardTracking,
  deleteCardTracking,
		addTrackingEvent,
} = require('../controllers/trackCardController');

const router = express.Router();

// 🔐 Protect all routes with authentication
router.use(authenticate);

// User routes
router.get('/', getMyCardTracking);
router.post('/', createCardOrder);
router.get('/:orderId', getMyCardTrackingByOrder);

// Admin routes (still protected by authenticate, but you may add extra admin checks later)
router.get('/admin/all', getAllCardTracking);
router.get('/admin/:id', getCardTrackingById);
router.post('/admin', createCardTracking);
router.put('/admin/:id', updateCardTracking);
router.delete('/admin/:id', deleteCardTracking);
router.post('/admin/:id/events', addTrackingEvent);

module.exports = router;