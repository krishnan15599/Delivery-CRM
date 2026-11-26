const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/vapid-public-key', notificationController.getVapidPublicKey);
router.post('/subscribe', notificationController.subscribe);
router.post('/unsubscribe', notificationController.unsubscribe);
router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
