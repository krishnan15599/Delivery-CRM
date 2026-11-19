const express = require('express');
const router = express.Router();
const {
  getDeliveries,
  getDeliveryById,
  getDeliveryByTracking,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  bulkAssignDeliveries,
  deleteDelivery,
} = require('../controllers/deliveryController');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateDelivery,
  validateUpdateDelivery,
  validateDeliveryStatusTransition,
  validateBulkAssign,
} = require('../validators/deliveryValidator');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.route('/')
  .get(getDeliveries)
  .post(requireRole('Admin', 'Manager'), validateBody(validateCreateDelivery), createDelivery);

router.post('/bulk-assign', requireRole('Admin', 'Manager'), validateBody(validateBulkAssign), bulkAssignDeliveries);

router.get('/tracking/:trackingNumber', getDeliveryByTracking);

router.get('/:id', getDeliveryById);
router.put('/:id', requireRole('Admin', 'Manager'), validateBody(validateUpdateDelivery), updateDelivery);
router.patch('/:id', requireRole('Admin', 'Manager'), validateBody(validateUpdateDelivery), updateDelivery);
router.delete('/:id', requireRole('Admin'), deleteDelivery);

// Status transition — Admin, Manager, and Agent can update status (Agents update field delivery status)
router.patch(
  '/:id/status',
  requireRole('Admin', 'Manager', 'Agent'),
  validateBody(validateDeliveryStatusTransition),
  updateDeliveryStatus
);

module.exports = router;
