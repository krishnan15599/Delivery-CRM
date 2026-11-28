const express = require('express');
const router = express.Router();
const { createOrder, getOrderStatus } = require('../controllers/integrationController');
const { requireApiKey } = require('../middlewares/apiKeyAuth');
const { validateBody } = require('../middlewares/validate');
const { validateIntegrationOrder } = require('../validators/integrationValidator');

router.use(requireApiKey);

router.post('/orders', validateBody(validateIntegrationOrder), createOrder);
router.get('/orders/:trackingNumber', getOrderStatus);

module.exports = router;
