const { sendError } = require('../utils/apiResponse');
const { MESSAGE_VISIBILITY } = require('../utils/chatAccess');

const validateSendMessage = (req, res, next) => {
  const { text, visibility } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return sendError(res, 400, 'Message text is required.');
  }
  if (text.trim().length > 2000) {
    return sendError(res, 400, 'Message text must be 2000 characters or fewer.');
  }
  if (
    visibility !== undefined &&
    visibility !== MESSAGE_VISIBILITY.PUBLIC &&
    visibility !== MESSAGE_VISIBILITY.STAFF_ONLY
  ) {
    return sendError(res, 400, "Visibility must be 'public' or 'staff_only'.");
  }
  next();
};

const validateDirectChatBody = (req, res, next) => {
  const { targetProfileId } = req.body || {};
  if (typeof targetProfileId !== 'string' || !targetProfileId.trim()) {
    return sendError(res, 400, 'targetProfileId is required.');
  }
  next();
};

const validateConversationStatus = (req, res, next) => {
  const { status } = req.body || {};
  if (status !== 'open' && status !== 'closed') {
    return sendError(res, 400, "Status must be 'open' or 'closed'.");
  }
  next();
};

module.exports = {
  validateSendMessage,
  validateDirectChatBody,
  validateConversationStatus,
};
