const { safeTrim } = require('../utils/sanitize');

const validateLogin = (body = {}) => {
  const email = safeTrim(body.email);
  const password = body.password ? String(body.password) : '';

  if (!email) {
    return {
      error: { message: 'email is required for login.' },
    };
  }

  return {
    value: {
      email: email.toLowerCase(),
      password,
    },
  };
};

module.exports = {
  validateLogin,
};

