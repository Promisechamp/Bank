const express = require('express');
const {
  initiateTransfer,
  verifyOtpAndComplete,
  getTransactionHistory,
  getTransactionByReference,
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Initiate transfer (sends OTP)
router.post('/transfer/initiate', initiateTransfer);

// Verify OTP and complete transfer
router.post('/transfer/verify', verifyOtpAndComplete);

// Transaction history
router.get('/history/:accountId', getTransactionHistory);

// Get transaction by reference
router.get('/reference/:referenceId', getTransactionByReference);

module.exports = router;








