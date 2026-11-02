const profileService = require('../services/profileService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getProfiles = async (req, res) => {
  const profiles = await profileService.listProfiles(req.query);
  return sendSuccess(res, 200, 'Profiles retrieved successfully', profiles);
};

/**
 * Get current authenticated user profile
 * Fix: Uses authenticated req.user (from token). No hardcoded Admin fallback!
 */
const getCurrentProfile = async (req, res) => {
  if (!req.user) {
    return sendError(res, 401, 'Authentication required to access current profile.');
  }

  let profile = null;
  try {
    if (req.user.id) {
      profile = await profileService.getProfileById(req.user.id);
    }
    if (!profile && req.user.email) {
      profile = await profileService.getProfileByEmail(req.user.email);
    }
  } catch (_dbErr) {
    // If database query fails, fall back to authenticated token identity
  }

  if (!profile) {
    // If not in database table or DB offline, return the authenticated token user object
    return sendSuccess(res, 200, 'Current profile retrieved from session', req.user);
  }

  return sendSuccess(res, 200, 'Current profile retrieved successfully', profile);
};

const getProfileById = async (req, res) => {
  const profile = await profileService.getProfileById(req.params.id);
  if (!profile) {
    return sendError(res, 404, `Profile with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Profile retrieved successfully', profile);
};

const createProfile = async (req, res) => {
  const profile = await profileService.createProfile(req.body);
  return sendSuccess(res, 201, 'Profile created successfully', profile);
};

const updateProfile = async (req, res) => {
  const profile = await profileService.updateProfile(req.params.id, req.body);
  if (!profile) {
    return sendError(res, 404, `Profile with ID '${req.params.id}' not found`);
  }
  return sendSuccess(res, 200, 'Profile updated successfully', profile);
};

const deleteProfile = async (req, res) => {
  const success = await profileService.deleteProfile(req.params.id);
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
