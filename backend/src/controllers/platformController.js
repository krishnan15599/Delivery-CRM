const platformService = require('../services/platformService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const listOrganizations = async (_req, res) => {
  const organizations = await platformService.listOrganizations();
  return sendSuccess(res, 200, 'Businesses retrieved successfully', organizations);
};

const createOrganization = async (req, res) => {
  const result = await platformService.createOrganization(req.body);
  return sendSuccess(
    res,
    201,
    `Business '${result.organization.name}' created. ${result.admin.email} can now sign in.`,
    result
  );
};

const setOrganizationStatus = async (req, res) => {
  const organization = await platformService.setOrganizationStatus(req.params.id, req.body.status);
  if (!organization) {
    return sendError(res, 404, `Business with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, `Business is now ${organization.status}`, organization);
};

module.exports = {
  listOrganizations,
  createOrganization,
  setOrganizationStatus,
};
