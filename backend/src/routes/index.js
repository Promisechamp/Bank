const express = require('express');
const authRoutes = require('./authRoutes');
const accountRoutes = require('./accountRoutes');
const transactionRoutes = require('./transactionRoutes');
const adminRoutes = require('./adminRoutes'); // NEW
const chatRoutes = require('./chatRoutes');

const router = express.Router();

// API routes
router.use('/auth', authRoutes);
router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);
router.use('/chat', chatRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Banking Demo API'
  });
});

module.exports = router;




