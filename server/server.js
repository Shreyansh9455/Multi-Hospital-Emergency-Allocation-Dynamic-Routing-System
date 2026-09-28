const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socketService');

const healthRoutes = require('./routes/healthRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const caseRoutes = require('./routes/caseRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Load environment variables
dotenv.config();

// Initialize Express App & HTTP Server
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO server attached to Express HTTP server (Day 21)
initSocket(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: '*', // Allow all origins for dev/testing or specify CLIENT_URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/ambulances', ambulanceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Hospital Bed & Emergency Dispatch Manager API',
    status: 'online',
    realtime: 'Socket.IO Enabled',
    endpoints: {
      health: '/api/health',
      hospitals: '/api/hospitals',
      cases: '/api/cases',
      ambulances: '/api/ambulances',
      auth: '/api/auth',
      analytics: '/api/analytics/summary',
    },
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
});

// Start HTTP + WebSocket Server
server.listen(PORT, () => {
  console.log(`🚀 Server + Socket.IO running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏥 Hospitals API: http://localhost:${PORT}/api/hospitals`);
  console.log(`📋 Cases API: http://localhost:${PORT}/api/cases`);
  console.log(`🚑 Ambulances API: http://localhost:${PORT}/api/ambulances`);
  console.log(`📊 Analytics API: http://localhost:${PORT}/api/analytics/summary`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
});

module.exports = { app, server };

