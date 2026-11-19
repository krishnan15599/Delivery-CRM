const express = require('express');
const cors = require('cors');
const { supabase, isDbConfigured } = require('./config/supabase');
const apiRoutes = require('./routes');
const { requestLogger } = require('./middlewares/logger');
const { authenticate } = require('./middlewares/auth');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/errorHandler');

const app = express();

// Websites allowed to call this API from a browser (CORS).
// Always allowed: local development + the production frontend.
// CORS_ORIGIN (comma-separated) ADDS more, e.g. a custom domain.
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'https://delivery-crm-7fl4.onrender.com',
  'https://delivery-crm-eight.vercel.app',
];

// A browser origin never has a path: "https://site.vercel.app/login/" -> "https://site.vercel.app"
const toOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, ''); // e.g. '*'
  }
};

const allowedOrigins = [
  ...new Set([
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ORIGIN || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
      .map(toOrigin),
  ]),
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
      const err = new Error(
        `CORS blocked for origin: ${origin}. Add it to CORS_ORIGIN on the backend.`
      );
      err.status = 403;
      return callback(err);
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

