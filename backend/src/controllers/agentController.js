const agentService = require('../services/agentService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');

const getAgents = async (req, res) => {
  const result = await agentService.listAgents(req.user, req.query);
  if (result.isPaginated) {
    return sendPaginated(res, result.data, {
      page: result.page,
      pageSize: result.pageSize,
      total: result.count,
    });
  }
  return sendSuccess(res, 200, 'Agents retrieved successfully', result.data, {
    total: result.count,
  });
};

const getAgentById = async (req, res) => {
  const agent = await agentService.getAgentById(req.user, req.params.id);
  if (!agent) {
    return sendError(res, 404, `Agent with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Agent details retrieved successfully', agent);
};

const createAgent = async (req, res) => {
  const agent = await agentService.createAgent(req.user, req.body);
  return sendSuccess(res, 201, 'Agent created successfully', agent);
};

const updateAgent = async (req, res) => {
  const agent = await agentService.updateAgent(req.user, req.params.id, req.body);
  if (!agent) {
    return sendError(res, 404, `Agent with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Agent updated successfully', agent);
};

/**
 * Update Agent availability status.
 * Scoped: Agents can only reach their own row (others -> 404); Managers their teams; Admins all.
 */
const updateAgentStatus = async (req, res) => {
  const agentId = req.params.id;
  const agent = await agentService.updateAgentStatus(req.user, agentId, req.body.status);
  if (!agent) {
    return sendError(res, 404, `Agent with ID '${agentId}' not found`);
  }
  return sendSuccess(res, 200, `Agent status updated to '${req.body.status}' successfully`, agent);
};

const deleteAgent = async (req, res) => {
  const success = await agentService.deleteAgent(req.user, req.params.id);
  if (!success) {
    return sendError(res, 404, `Agent with ID '${req.params.id}' not found or already deleted.`);
  }
  return sendSuccess(res, 200, 'Agent deleted successfully', { id: req.params.id });
};

module.exports = {
  getAgents,
  getAgentById,
  createAgent,
  updateAgent,
  updateAgentStatus,
  deleteAgent,
};

