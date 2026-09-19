const express = require('express');
const {
  register,
  selfRegister,
  login,
  getProfile,
  updateProfile,
  getSecuritySettings,
  createSecuritySettings,
  updateSecuritySettings,
  verifyTransferPin,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/self-register', selfRegister);
router.post('/login', login);

// Protected routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

router.get('/security', authenticate, getSecuritySettings);
router.post('/security', authenticate, createSecuritySettings);
router.put('/security', authenticate, updateSecuritySettings);
router.post('/security/verify-transfer-pin', authenticate, verifyTransferPin);

module.exports = router;