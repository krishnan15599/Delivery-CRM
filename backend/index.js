require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Delivery CRM Backend API',
    status: 'Running'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(supabase)
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  if (!supabase) {
    console.log('ℹ️  Note: Update backend/.env with your Supabase URL & Key to connect to the database.');
  }
});
