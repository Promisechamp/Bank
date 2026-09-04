const express = require('express');
const {
  createAccount,
  listAccounts,
  getAccount,
  getBalance,
  closeAccount,
  checkAccountExists, 
} = require('../controllers/accountController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All account routes require authentication
router.use(authenticate);

// Account management
router.post('/', createAccount);
router.get('/', listAccounts);
router.get('/:accountId', getAccount);
router.get('/:accountId/balance', getBalance);
router.delete('/:accountId', closeAccount);

// ✅ Account existence check (put before :accountId to avoid conflict)
router.get('/check/:accountNumber', checkAccountExists);

module.exports = router;