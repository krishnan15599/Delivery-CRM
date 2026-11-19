const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerDeliveries,
} = require('../controllers/customerController');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateCustomer,
  validateUpdateCustomer,
} = require('../validators/customerValidator');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

// Customers are business-wide data for Admins and Managers (Agents get 403)
router.use(requireRole('Admin', 'Manager'));

router.route('/')
  .get(getCustomers)
  .post(requireRole('Admin', 'Manager'), validateBody(validateCreateCustomer), createCustomer);

router.get('/:id', getCustomerById);
router.get('/:id/deliveries', getCustomerDeliveries);

// Only Admin or Manager can mutate
router.put('/:id', requireRole('Admin', 'Manager'), validateBody(validateUpdateCustomer), updateCustomer);
router.patch('/:id', requireRole('Admin', 'Manager'), validateBody(validateUpdateCustomer), updateCustomer);
router.delete('/:id', requireRole('Admin'), deleteCustomer);

module.exports = router;
