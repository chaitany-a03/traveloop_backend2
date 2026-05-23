require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { syncDatabase } = require('./src/models');
const { errorHandler } = require('./src/middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/trips', require('./src/routes/trips'));
app.use('/api/trips/:tripId/stops', require('./src/routes/stops'));
app.use('/api/trips/:tripId/budget', require('./src/routes/budgets'));
app.use('/api/trips/:tripId/checklist', require('./src/routes/checklists'));
app.use('/api/trips/:tripId/notes', require('./src/routes/notes'));
app.use('/api/activities', require('./src/routes/activities'));
app.use('/api/places',    require('./src/routes/googlePlacesRoutes'));
app.use('/api/planner',   require('./src/routes/plannerRoutes'));
app.use('/api/hidden-gems', require('./src/routes/hiddenGems'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await syncDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Traveloop API running on http://localhost:${PORT}`);
  });
};

start();
