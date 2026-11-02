const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const login = async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, 'Login successful', result);
};

const getMe = async (req, res) => {
  if (!req.user) {
    return sendError(res, 401, 'Not authenticated');
  }
  return sendSuccess(res, 200, 'Current user profile retrieved', req.user);
};

module.exports = {
  login,
  getMe,
};

