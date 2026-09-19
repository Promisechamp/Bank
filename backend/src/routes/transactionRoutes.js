const express = require('express');
const {
  initiateTransfer,
  verifyOtpAndComplete,
		verifyPinAndComplete,
  getTransactionHistory,
  getTransactionByReference,
} = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.post('/transfer/initiate', authenticate, initiateTransfer);
router.post('/transfer/verify-otp', authenticate, verifyOtpAndComplete);
router.post('/transfer/verify-pin', authenticate, verifyPinAndComplete);
router.get('/history/:accountId', authenticate, getTransactionHistory);
router.get('/reference/:referenceId', getTransactionByReference);
module.exports = router;






