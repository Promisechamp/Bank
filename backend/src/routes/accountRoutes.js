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
router.use(authenticate);

router.post('/', createAccount);
router.get('/', listAccounts);
router.get('/check/:accountNumber', checkAccountExists);
router.get('/:accountId', getAccount);
router.get('/:accountId/balance', getBalance);
router.delete('/:accountId', closeAccount);

module.exports = router;