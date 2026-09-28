const express = require('express');
const router = express.Router();
const {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  updateAmbulanceStatus,
} = require('../controllers/ambulanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/ambulances - List all ambulances (?status=idle|enroute|busy)
router.get('/', getAllAmbulances);

// POST /api/ambulances - Register new ambulance
router.post('/', createAmbulance);

// GET /api/ambulances/:id - Get ambulance by ID
router.get('/:id', getAmbulanceById);

// PUT /api/ambulances/:id - Update location or info
router.put('/:id', updateAmbulance);

// PUT /api/ambulances/:id/status - Update status (Day 25: Protected - ambulanceDriver or districtAdmin)
router.put(
  '/:id/status',
  protect,
  authorize('ambulanceDriver', 'districtAdmin'),
  updateAmbulanceStatus
);

module.exports = router;

