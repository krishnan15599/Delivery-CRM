const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { validateSendMessage } = require('../validators/chatValidator');

// Option B: Public customer tracking info & chat (no login, authenticated by trackingToken)
router.get('/:trackingToken', chatController.getCustomerTrackingInfo);
router.get('/:trackingToken/chat', chatController.getCustomerTrackingChat);
router.post('/:trackingToken/chat/messages', validateSendMessage, chatController.sendCustomerMessage);

module.exports = router;
