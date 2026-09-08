const express = require('express');
const authRoutes = require('./authRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const adminRoutes = require('./adminRoutes');
const chatRoutes = require('./chatRoutes');
const trackCardRoutes = require('./trackCardRoutes');
const notificationRoutes = require('./notificationRoutes');
const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);
router.use('/card-tracking', trackCardRoutes);
router.use('/notifications', notificationRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Banking Demo API'
  });
});

module.exports = router;