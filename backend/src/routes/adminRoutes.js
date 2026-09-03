const express = require('express');
const { authenticate } = require('../middleware/auth');
const { adminAuth } = require('../middleware/adminAuth');
const {
  // User management
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  // Account management
  getAllAccounts,
		getAccountById,
  updateAccountStatus,
  // Transaction management
  getAllTransactions,
  getTransactionById,
  approveTransaction,
  rejectTransaction,
  // System stats
  getSystemStats,
		adminCredit,
		adminDebit,
		updateTransaction
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticate);
router.use(adminAuth);

// User management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId', updateUser);
router.patch('/users/:userId/status', updateUserStatus);
router.delete('/users/:userId', deleteUser);

// Account management
router.get('/accounts', getAllAccounts);
router.get('/accounts/:accountId', getAccountById); 
router.patch('/accounts/:accountId/status', updateAccountStatus);

// Transaction management
router.get('/transactions', getAllTransactions);
router.get('/transactions/:txId', getTransactionById);
router.patch('/transactions/:txId/approve', approveTransaction);
router.patch('/transactions/:txId/reject', rejectTransaction);
// Credit / Debit
router.post('/users/:userId/credit', adminCredit);
router.post('/users/:userId/debit', adminDebit);
router.patch('/transactions/:txId', updateTransaction);

// System stats
router.get('/stats', getSystemStats);

module.exports = router;




