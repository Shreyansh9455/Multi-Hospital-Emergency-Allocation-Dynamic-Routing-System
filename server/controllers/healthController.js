const mongoose = require('mongoose');

/**
 * Health check controller
 * GET /api/health
 * Returns { status: "ok", ... }
 */
const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Hospital Bed & Emergency Dispatch Manager Backend API',
    version: '1.0.0',
    database: {
      status: dbStateMap[dbState] || 'unknown',
      connected: dbState === 1,
    },
    uptime: Math.floor(process.uptime()),
  });
};

module.exports = {
  getHealthStatus,
};
