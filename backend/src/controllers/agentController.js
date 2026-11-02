const agentService = require('../services/agentService');
const { sendSuccess, sendPaginated, sendError } = require('../utils/apiResponse');

const getAgents = async (req, res) => {
  const result = await agentService.listAgents(req.query);
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
  const agent = await agentService.getAgentById(req.params.id);
  if (!agent) {
    return sendError(res, 404, `Agent with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Agent details retrieved successfully', agent);
};

const createAgent = async (req, res) => {
  const agent = await agentService.createAgent(req.body);
  return sendSuccess(res, 201, 'Agent created successfully', agent);
};

const updateAgent = async (req, res) => {
  const agent = await agentService.updateAgent(req.params.id, req.body);
  if (!agent) {
    return sendError(res, 404, `Agent with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Agent updated successfully', agent);
};

/**
 * Update Agent Status specifically
 * Fix: Properly returns 404 if agent not found
 * Fix: Restricts Agents to only updating their own status; Admins and Managers can update any agent.
 */
const updateAgentStatus = async (req, res) => {
  const agentId = req.params.id;
  const targetAgent = await agentService.getAgentById(agentId);
  if (!targetAgent) {
    return sendError(res, 404, `Agent with ID '${agentId}' not found`);
  }

  if (req.user && req.user.role === 'Agent') {
    const isOwner =
      (targetAgent.user_id && targetAgent.user_id === req.user.id) ||
      (targetAgent.email && targetAgent.email.toLowerCase() === req.user.email?.toLowerCase());

    if (!isOwner) {
      return sendError(res, 403, 'Forbidden: Agents may only update their own status.');
    }
  }

  const agent = await agentService.updateAgentStatus(agentId, req.body.status);
  return sendSuccess(res, 200, `Agent status updated to '${req.body.status}' successfully`, agent);
};

const deleteAgent = async (req, res) => {
  const success = await agentService.deleteAgent(req.params.id);
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

