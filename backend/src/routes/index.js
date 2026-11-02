const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const profileRoutes = require('./profileRoutes');
const agentRoutes = require('./agentRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const { ensureDb } = require('../middlewares/ensureDb');

// Public auth routes (login)
router.use('/auth', authRoutes);

// Protected data routes protected with ensureDb middleware
router.use('/customers', ensureDb, customerRoutes);
router.use('/profiles', ensureDb, profileRoutes);
router.use('/agents', ensureDb, agentRoutes);
router.use('/deliveries', ensureDb, deliveryRoutes);

// API Documentation / Index route
router.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'Delivery CRM REST API',
    version: '2.0.0',
    auth: {
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
    },
    endpoints: {
      customers: '/api/customers',
      profiles: '/api/profiles',
      agents: '/api/agents',
      deliveries: '/api/deliveries',
      health: '/api/health',
    },
  });
});

module.exports = router;

