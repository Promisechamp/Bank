const express = require('express');
const { authenticate } = require('../middleware/auth'); // 👈 your auth middleware
const {
  createConversation,
  startNewConversation,
  getUserConversations,
  getConversationById,
  getAdminConversations,
  sendMessage,
  markConversationRead,
  closeConversation,
		deleteConversation,
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
router.delete( '/conversations/:conversationId', deleteConversation);
router.get('/admin/conversations', getAdminConversations);


module.exports = router;