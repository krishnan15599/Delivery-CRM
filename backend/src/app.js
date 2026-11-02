const express = require('express');
const cors = require('cors');
const { supabase, isDbConfigured } = require('./config/supabase');
const apiRoutes = require('./routes');
const { requestLogger } = require('./middlewares/logger');
const { authenticate } = require('./middlewares/auth');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

// Security & Parsing Middlewares
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
      'https://delivery-crm-7fl4.onrender.com',
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Global user authentication extractor (extracts Bearer token into req.user)
app.use(authenticate);

// Root Index route
app.get('/', (_req, res) => {
  res.json({
    name: 'Delivery CRM Backend API',
    status: 'Running',
    version: '2.0.0',
    documentation: {
      health: '/api/health',
      auth: '/api/auth/login',
      customers: '/api/customers',
      profiles: '/api/profiles',
      agents: '/api/agents',
      deliveries: '/api/deliveries',
    },
  });
});

// System Health Check
// Fix: Checks Supabase result.error correctly since supabase-js returns error objects instead of throwing
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'Not Configured';
  let stats = {};

  if (isDbConfigured()) {
    try {
      const [custRes, profRes, agentRes, delRes] = await Promise.all([
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('deliveries').select('*', { count: 'exact', head: true }),
      ]);

      const firstError = custRes.error || profRes.error || agentRes.error || delRes.error;

      if (firstError) {
        dbStatus = `Error: ${firstError.message}`;
      } else {
        dbStatus = 'Connected';
        stats = {
          customers: custRes.count || 0,
          profiles: profRes.count || 0,
          agents: agentRes.count || 0,
          deliveries: delRes.count || 0,
        };
      }
    } catch (err) {
      dbStatus = `Error: ${err.message}`;
    }
  }

  res.json({
    status: dbStatus === 'Connected' ? 'OK' : 'Degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      configured: isDbConfigured(),
      counts: stats,
    },
  });
});

// Mount All API Routes under /api
app.use('/api', apiRoutes);

// Fallback & Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;

