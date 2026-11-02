const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const { validateBody } = require('../middlewares/validate');
const { validateLogin } = require('../validators/authValidator');
const { requireAuth } = require('../middlewares/auth');

router.post('/login', validateBody(validateLogin), login);
router.get('/me', requireAuth, getMe);

module.exports = router;

