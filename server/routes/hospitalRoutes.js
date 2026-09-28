const express = require('express');
const router = express.Router();
const {
  getAllHospitals,
  getHospitalById,
  updateHospital,
} = require('../controllers/hospitalController');
const { protect, checkHospitalAccess } = require('../middleware/authMiddleware');

// GET /api/hospitals - List all hospitals (Public)
router.get('/', getAllHospitals);

// GET /api/hospitals/:id - Get single hospital by ID (Public)
router.get('/:id', getHospitalById);

// PUT /api/hospitals/:id - Update hospital capacity (Day 25: Protected - hospitalStaff for assigned hospital or districtAdmin)
router.put('/:id', protect, checkHospitalAccess, updateHospital);

module.exports = router;

