const organizationService = require('../services/organizationService');
const teamService = require('../services/teamService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getOrganization = async (req, res) => {
  const organization = await organizationService.getOrganization(req.user);
  if (!organization) {
    return sendError(res, 404, 'Business not found');
  }
  return sendSuccess(res, 200, 'Business retrieved successfully', organization);
};

const updateOrganization = async (req, res) => {
  const organization = await organizationService.updateOrganization(req.user, req.body);
  return sendSuccess(res, 200, 'Business updated successfully', organization);
};

const getTeams = async (req, res) => {
  const teams = await teamService.listTeamsForUser(req.user);
  return sendSuccess(res, 200, 'Teams retrieved successfully', teams);
};

module.exports = {
  getOrganization,
  updateOrganization,
  getTeams,
};
