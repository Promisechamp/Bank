const express = require('express');
const {
  adminGetAllAccounts,
  adminGetAccountById,
  adminUpdateAccountStatus,
  adminDeleteAccount,
} = require('../controllers/accountController');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getSystemStats,
  layoutStats,
  getRegisterTokens,
  generateRegisterToken,
  revokeRegisterToken,
  adminCredit,      // ← ADD THIS
  adminDebit        // ← ADD THIS
} = require('../controllers/adminController');
const {
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  approveTransaction,
  rejectTransaction,
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ============================================
// USERS
// ============================================
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.patch('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// ============================================
// ACCOUNTS (admin)
// ============================================
router.get('/accounts', adminGetAllAccounts);
router.get('/accounts/:accountId', adminGetAccountById);
router.patch('/accounts/:accountId/status', adminUpdateAccountStatus);
router.delete('/accounts/:accountId', adminDeleteAccount);

// ============================================
// TRANSACTIONS (admin)
// ============================================
router.get('/transactions', getAllTransactions);
router.get('/transactions/:txId', getTransactionById);
router.patch('/transactions/:txId', updateTransaction);
router.patch('/transactions/:txId/approve', approveTransaction);
router.patch('/transactions/:txId/reject', rejectTransaction);

// ============================================
// ADMIN CREDIT / DEBIT
// ============================================
router.post('/users/:userId/credit', adminCredit);
router.post('/users/:userId/debit', adminDebit);

// ============================================
// REGISTER TOKENS
// ============================================
router.post('/tokens/generate', generateRegisterToken);
router.get('/tokens', getRegisterTokens);
router.delete('/tokens/:token', revokeRegisterToken);

// ============================================
// STATS
// ============================================
router.get('/stats', getSystemStats);
router.get('/stats/layout', layoutStats);

module.exports = router;