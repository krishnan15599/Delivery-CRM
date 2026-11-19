const express = require('express');
const router = express.Router();

const {
  getOrganization,
  updateOrganization,
  getTeams,
} = require('../controllers/organizationController');
const { requireRole } = require('../middlewares/auth');
const { validateBody } = require('../middlewares/validate');
const { validateUpdateOrganization } = require('../validators/platformValidator');

// Mounted at /api/organization (business users only — see routes/index.js)
router.route('/')
  .get(getOrganization)
  .put(requireRole('Admin'), validateBody(validateUpdateOrganization), updateOrganization);

// Teams the signed-in user may see: Admin all, Manager/Agent their own
router.get('/teams', getTeams);

module.exports = router;
