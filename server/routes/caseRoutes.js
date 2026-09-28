const express = require('express');
const router = express.Router();
const {
  createCase,
  getAllCases,
  getCaseById,
  triageExistingCase,
  dispatchEmergencyCase,
} = require('../controllers/caseController');

// POST /api/cases - Create new emergency case
router.post('/', createCase);

// GET /api/cases - List all cases (supports ?status=waiting|dispatched|admitted)
router.get('/', getAllCases);

// GET /api/cases/:id - Get single case by ID with populated references
router.get('/:id', getCaseById);

// POST /api/cases/:id/triage - Triage scoring engine (Day 7)
router.post('/:id/triage', triageExistingCase);

// POST /api/cases/:id/dispatch - Dispatch to best hospital & idle ambulance (Day 8, 9, 10)
router.post('/:id/dispatch', dispatchEmergencyCase);

module.exports = router;
