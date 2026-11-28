const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const {
  validateSendMessage,
  validateDirectChatBody,
  validateConversationStatus,
} = require('../validators/chatValidator');

// Staff chat routes (protected by requireAuth + requireOrgUser in routes/index.js)
router.get('/conversations', chatController.listConversations);
router.post('/conversations/delivery/:deliveryId', chatController.getOrCreateDeliveryConversation);
router.post('/conversations/direct', validateDirectChatBody, chatController.getOrCreateDirectStaffConversation);
router.get('/conversations/:id/messages', chatController.getStaffConversationMessages);
router.post('/conversations/:id/messages', validateSendMessage, chatController.sendStaffMessage);
router.patch('/conversations/:id/status', validateConversationStatus, chatController.updateConversationStatus);

module.exports = router;
