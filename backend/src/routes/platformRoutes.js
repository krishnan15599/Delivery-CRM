const express = require('express');
const router = express.Router();

const {
  listOrganizations,
  createOrganization,
  setOrganizationStatus,
} = require('../controllers/platformController');
const { requireSuperAdmin } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateOrganization,
  validateOrganizationStatus,
} = require('../validators/platformValidator');

// Platform owner only
router.use(requireSuperAdmin);

router.route('/organizations')
  .get(listOrganizations)
  .post(validateBody(validateCreateOrganization), createOrganization);

router.patch('/organizations/:id', validateBody(validateOrganizationStatus), setOrganizationStatus);

module.exports = router;
