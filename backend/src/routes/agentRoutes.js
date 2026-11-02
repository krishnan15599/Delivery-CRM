const express = require('express');
const router = express.Router();
const {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
} = require('../controllers/agentController');
const { validateBody } = require('../middlewares/validate');
const {
  validateCreateAgent,
  validateUpdateAgent,
  validateUpdateAgentStatus,
} = require('../validators/agentValidator');
const { requireAuth, requireRole } = require('../middlewares/auth');

router.use(requireAuth);

router.route('/')
  .get(getAgents)
  .post(requireRole('Admin', 'Manager'), validateBody(validateCreateAgent), createAgent);

router.get('/:id', getAgentById);

router.put('/:id', requireRole('Admin', 'Manager'), validateBody(validateUpdateAgent), updateAgent);

// Agents can update their own status; Managers and Admins can update any agent's status
router.patch('/:id/status', validateBody(validateUpdateAgentStatus), updateAgentStatus);

router.delete('/:id', requireRole('Admin'), deleteAgent);

module.exports = router;
