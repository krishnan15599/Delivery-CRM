const profileService = require('../services/profileService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getProfiles = async (req, res) => {
  const profiles = await profileService.listProfiles(req.user, req.query);
  return sendSuccess(res, 200, 'Profiles retrieved successfully', profiles);
};

/**
 * Current signed-in user: the context loaded by the auth middleware
 * (profile + business + teams), so it is always fresh.
 */
const getCurrentProfile = async (req, res) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentication required to access current profile.');
  }
  return sendSuccess(res, 200, 'Current profile retrieved successfully', req.user);
};

const getProfileById = async (req, res) => {
  const profile = await profileService.getProfileById(req.user, req.params.id);
  if (!profile) {
    return sendError(res, 404, `Profile with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Profile retrieved successfully', profile);
};

/** Admin: Admin/Manager/Agent. Manager: Agent only (checked in the service). */
const createProfile = async (req, res) => {
  const profile = await profileService.createProfile(req.user, req.body);
  return sendSuccess(res, 201, 'User created successfully', profile);
};

const updateProfile = async (req, res) => {
  const profile = await profileService.updateProfile(req.user, req.params.id, req.body);
  if (!profile) {
    return sendError(res, 404, `Profile with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Profile updated successfully', profile);
};

const deleteProfile = async (req, res) => {
  const success = await profileService.deleteProfile(req.user, req.params.id);
  if (!success) {
    return sendError(res, 404, `Profile with ID '${req.params.id}' not found or already deleted.`);
  }
  return sendSuccess(res, 200, 'Profile deleted successfully', { id: req.params.id });
};

module.exports = {
  getProfiles,
  getCurrentProfile,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile,
};
