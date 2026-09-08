const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Get notifications
router.get('/', notificationController.getNotifications);

// IMPORTANT: static route before dynamic :id route
router.put('/read-all', notificationController.markAllAsRead);

// Mark one notification as read
router.put('/:id/read', notificationController.markAsRead);

// Create/send system notification
router.post('/', notificationController.sendSystemNotification);

// Delete notifications / batch delete / delete all
router.delete('/', notificationController.deleteNotifications);

// Delete one notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;