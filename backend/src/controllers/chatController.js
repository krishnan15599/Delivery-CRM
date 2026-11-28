const chatService = require('../services/chatService');
const { sendSuccess } = require('../utils/apiResponse');

const listConversations = async (req, res, next) => {
  try {
    const data = await chatService.listConversations(req.user, { type: req.query.type });
    return sendSuccess(res, 200, 'Conversations retrieved', data);
  } catch (err) {
    return next(err);
  }
};

const getOrCreateDeliveryConversation = async (req, res, next) => {
  try {
    const data = await chatService.getOrCreateDeliveryConversation(req.user, req.params.deliveryId);
    return sendSuccess(res, 200, 'Delivery conversation ready', data);
  } catch (err) {
    return next(err);
  }
};

const getOrCreateDirectStaffConversation = async (req, res, next) => {
  try {
    const data = await chatService.getOrCreateDirectStaffConversation(req.user, req.body.targetProfileId);
    return sendSuccess(res, 200, 'Direct conversation ready', data);
  } catch (err) {
    return next(err);
  }
};

const getStaffConversationMessages = async (req, res, next) => {
  try {
    const data = await chatService.getStaffConversationMessages(req.user, req.params.id);
    return sendSuccess(res, 200, 'Conversation messages retrieved', data);
  } catch (err) {
    return next(err);
  }
};

const sendStaffMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendStaffMessage(req.user, req.params.id, req.body);
    return sendSuccess(res, 201, 'Message sent', data);
  } catch (err) {
    return next(err);
  }
};

const updateConversationStatus = async (req, res, next) => {
  try {
    const data = await chatService.updateConversationStatus(req.user, req.params.id, req.body.status);
    return sendSuccess(res, 200, 'Conversation status updated', data);
  } catch (err) {
    return next(err);
  }
};

// Public Option B Customer Tracking Chat
const getCustomerTrackingChat = async (req, res, next) => {
  try {
    const data = await chatService.getCustomerTrackingChat(req.params.trackingToken);
    return sendSuccess(res, 200, 'Tracking chat retrieved', data);
  } catch (err) {
    return next(err);
  }
};

const sendCustomerMessage = async (req, res, next) => {
  try {
    const data = await chatService.sendCustomerMessage(req.params.trackingToken, req.body);
    return sendSuccess(res, 201, 'Message sent', data);
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  listConversations,
  getOrCreateDeliveryConversation,
  getOrCreateDirectStaffConversation,
  getStaffConversationMessages,
  sendStaffMessage,
  updateConversationStatus,
  getCustomerTrackingChat,
  sendCustomerMessage,
};
