const notificationService = require('../services/notificationService');
const { sendSuccess } = require('../utils/apiResponse');

const getVapidPublicKey = (_req, res) => {
  return sendSuccess(res, 200, 'VAPID public key retrieved', {
    publicKey: notificationService.getPublicVapidKey(),
  });
};

const subscribe = async (req, res, next) => {
  try {
    const subscription = await notificationService.saveSubscription(
      req.user,
      req.body.subscription || req.body,
      req.headers['user-agent']
    );
    return sendSuccess(res, 200, 'Push notifications enabled.', {
      subscribed: true,
      id: subscription.id,
    });
  } catch (err) {
    return next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    await notificationService.removeSubscription(req.user, req.body.endpoint);
    return sendSuccess(res, 200, 'Push notifications disabled.', { unsubscribed: true });
  } catch (err) {
    return next(err);
  }
};

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user, req.query.limit);
    return sendSuccess(res, 200, 'Notifications retrieved', result);
  } catch (err) {
    return next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.user, req.params.id);
    return sendSuccess(res, 200, 'Notification marked as read', updated);
  } catch (err) {
    return next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user);
    return sendSuccess(res, 200, 'All notifications marked as read', { success: true });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  listNotifications,
  markAsRead,
  markAllAsRead,
};
