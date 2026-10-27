require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { supabase } = require('./config/supabase');
const customerRoutes = require('./routes/customerRoutes');


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

app.get('/api/health', async (req, res) => {
  let dbStatus = 'Not Configured';
  let customerCount = 0;

  if (supabase) {
    try {
      const { count, error } = await supabase.from('customers').select('*', { count: 'exact', head: true });
      if (error) {
        dbStatus = `Error: ${error.message}`;
      } else {
        dbStatus = 'Connected';
        customerCount = count;
      }
    } catch (err) {
      dbStatus = `Error: ${err.message}`;
    }
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(supabase),
    databaseStatus: dbStatus,
    sampleCount: customerCount
  });
});

// API Routes
app.use('/api/customers', customerRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  if (!supabase) {
    console.log('ℹ️  Note: Update backend/.env with your Supabase URL & Key to connect to the database.');
  }
});