const express = require('express');
const router = express.Router();
const {
  getAnalyticsSummary,
  seedHistoricalLogs,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/analytics/summary - Aggregated metrics & comparisons (Day 23, 25: DistrictAdmin only)
router.get('/summary', protect, authorize('districtAdmin'), getAnalyticsSummary);

// POST /api/analytics/seed-logs - Seed historical demonstration records
router.post('/seed-logs', protect, authorize('districtAdmin'), seedHistoricalLogs);

module.exports = router;

