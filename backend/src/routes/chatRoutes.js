const express = require('express');
const { authenticate } = require('../middleware/auth'); // 👈 your auth middleware
const {
  createConversation,
  startNewConversation,
  getUserConversations,
  getConversationById,
  getAdminConversations,
  claimConversation,
  sendMessage,
  markConversationRead,
  closeConversation,
} = require('../controllers/chatController');

const router = express.Router();
router.use(authenticate); 

// ============================================================
// USER CHAT
// ============================================================
router.post('/conversations', createConversation);
router.post('/conversations/new', startNewConversation);
router.get('/conversations', getUserConversations);
router.get('/conversations/:conversationId', getConversationById);
router.post('/conversations/:conversationId/messages', sendMessage);
router.patch('/conversations/:conversationId/read', markConversationRead);
router.patch('/conversations/:conversationId/close', closeConversation);

// ============================================================
// ADMIN CHAT
// ============================================================
router.get('/admin/conversations', getAdminConversations);
router.patch('/admin/conversations/:conversationId/claim', claimConversation);

module.exports = router;