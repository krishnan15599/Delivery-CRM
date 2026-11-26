const notificationService = require('../services/notificationService');
const { ok } = require('../utils/apiResponse');

const getVapidPublicKey = (_req, res) => {
  return ok(res, { publicKey: notificationService.getPublicVapidKey() });
};

const subscribe = async (req, res, next) => {
  try {
    const subscription = await notificationService.saveSubscription(
      req.user,
      req.body.subscription || req.body,
      req.headers['user-agent']
    );
    return ok(res, { subscribed: true, id: subscription.id }, 'Push notifications enabled.');
  } catch (err) {
    return next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    await notificationService.removeSubscription(req.user, req.body.endpoint);
    return ok(res, { unsubscribed: true }, 'Push notifications disabled.');
  } catch (err) {
    return next(err);
  }
};

const listNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.listNotifications(req.user, req.query.limit);
    return ok(res, result);
  } catch (err) {
    return next(err);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markAsRead(req.user, req.params.id);
    return ok(res, updated);
  } catch (err) {
    return next(err);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAllAsRead(req.user);
    return ok(res, { success: true });
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
