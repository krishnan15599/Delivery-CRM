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

// System Health Check (public)
// Only says whether the database answers. No record counts or error details:
// this endpoint needs no login and the database is shared by all businesses.
app.get('/api/health', async (_req, res) => {
  let dbStatus = 'Not Configured';

  if (isDbConfigured()) {
    try {
      const { error } = await supabase.from('profiles').select('id', { head: true }).limit(1);
      if (error) {
        console.error('[health] Database check failed:', error.message);
        dbStatus = 'Error';
      } else {
        dbStatus = 'Connected';
      }
    } catch (err) {
      console.error('[health] Database check failed:', err.message);
      dbStatus = 'Error';
    }
  }

  res.json({
    status: dbStatus === 'Connected' ? 'OK' : 'Degraded',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      configured: isDbConfigured(),
    },
  });
});

// Mount All API Routes under /api
app.use('/api', apiRoutes);

// Fallback & Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;

