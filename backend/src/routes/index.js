const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const profileRoutes = require('./profileRoutes');
const agentRoutes = require('./agentRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const organizationRoutes = require('./organizationRoutes');
const platformRoutes = require('./platformRoutes');
const notificationRoutes = require('./notificationRoutes');
const chatRoutes = require('./chatRoutes');
const trackingChatRoutes = require('./trackingChatRoutes');
const merchantRoutes = require('./merchantRoutes');
const integrationRoutes = require('./integrationRoutes');
const { ensureDb } = require('../middlewares/ensureDb');
const { requireAuth, requireOrgUser, rejectTenantFields } = require('../middlewares/auth');

// The business (organization_id) always comes from the login, never from the client
router.use(rejectTenantFields);

// Public auth routes (login)
router.use('/auth', authRoutes);

// Option B: Public customer tracking link chat (no login, token-gated)
router.use('/track', ensureDb, trackingChatRoutes);

// Merchant e-commerce integration API (API-key gated, no user login)
router.use('/integrations', ensureDb, integrationRoutes);

// Platform owner (SuperAdmin): create / list / suspend businesses
router.use('/platform', requireAuth, ensureDb, platformRoutes);

// Business data: only users who belong to a business; every query is scoped to it
const businessOnly = [requireAuth, requireOrgUser, ensureDb];
router.use('/organization', ...businessOnly, organizationRoutes);
router.use('/customers', ...businessOnly, customerRoutes);
router.use('/profiles', ...businessOnly, profileRoutes);
router.use('/agents', ...businessOnly, agentRoutes);
router.use('/deliveries', ...businessOnly, deliveryRoutes);
router.use('/notifications', ...businessOnly, notificationRoutes);
router.use('/chat', ...businessOnly, chatRoutes);
router.use('/merchants', ...businessOnly, merchantRoutes);

// API Documentation / Index route
router.get('/', (_req, res) => {
  res.json({
    success: true,
    name: 'Delivery CRM REST API',
    version: '3.0.0',
    auth: {
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
    },
    endpoints: {
      platform: '/api/platform/organizations (SuperAdmin)',
      organization: '/api/organization, /api/organization/teams',
      customers: '/api/customers',
      profiles: '/api/profiles',
      agents: '/api/agents',
      deliveries: '/api/deliveries',
      health: '/api/health',
    },
  });
});

module.exports = router;
