const mongoose = require('mongoose');
const { Case, Hospital } = require('../models');
const { calculateTriageScore } = require('../services/triageService');
const { dispatchCase } = require('../services/dispatchService');
const { emitCaseUpdated } = require('../services/socketService');

/**
 * @desc    Create a new emergency case
 * @route   POST /api/cases
 * @access  Public
 */
const createCase = async (req, res) => {
  try {
    const {
      patientName,
      age,
      symptomTags,
      location,
      severityScore,
      status,
      assignedHospital,
      assignedAmbulance,
    } = req.body;

    // Validation: patientName
    if (!patientName || typeof patientName !== 'string' || patientName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'patientName is required and cannot be empty',
      });
    }

    // Validation: age
    if (age === undefined || age === null || isNaN(Number(age)) || Number(age) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'age is required and must be a positive number',
      });
    }

    // Validation: location { lat, lng }
    if (!location || typeof location !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'location object containing lat and lng is required',
      });
    }

    if (
      location.lat === undefined ||
      location.lng === undefined ||
      isNaN(Number(location.lat)) ||
      isNaN(Number(location.lng))
    ) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'location.lat and location.lng must be valid numeric coordinates',
      });
    }

    // Validation: severityScore (if provided)
    if (severityScore !== undefined && severityScore !== null) {
      const score = Number(severityScore);
      if (isNaN(score) || score < 1 || score > 10) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'severityScore must be a number between 1 and 10',
        });
      }
    }

    // Validation: symptomTags (ensure array of strings)
    let parsedSymptomTags = [];
    if (symptomTags) {
      if (Array.isArray(symptomTags)) {
        parsedSymptomTags = symptomTags.map((tag) => String(tag).trim()).filter(Boolean);
      } else if (typeof symptomTags === 'string') {
        parsedSymptomTags = symptomTags.split(',').map((tag) => tag.trim()).filter(Boolean);
      }
    }

    // If severityScore not explicitly passed, auto-compute via Triage engine
    const triageCalc =
      severityScore !== undefined && severityScore !== null
        ? null
        : calculateTriageScore(parsedSymptomTags, Number(age));

    const finalSeverityScore =
      severityScore !== undefined && severityScore !== null
        ? Number(severityScore)
        : triageCalc
        ? triageCalc.severityScore
        : null;

    const newCase = new Case({
      patientName: patientName.trim(),
      age: Number(age),
      symptomTags: parsedSymptomTags,
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng),
      },
      severityScore: finalSeverityScore,
      status: status || 'waiting',
      assignedHospital: assignedHospital || null,
      assignedAmbulance: assignedAmbulance || null,
    });

    const savedCase = await newCase.save();

    // Day 21: Real-time Socket.IO emission
    emitCaseUpdated(savedCase);

    return res.status(201).json({
      success: true,
      message: 'Emergency case created successfully',
      data: savedCase,
      triageDetails: triageCalc,
    });
  } catch (error) {
    console.error('Error creating case:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to create emergency case',
    });
  }
};

/**
 * @desc    Get all cases with optional ?status= query filter
 * @route   GET /api/cases
 * @access  Public
 */
const getAllCases = async (req, res) => {
  try {
    const { status, limit, sortBy } = req.query;
    const filter = {};

    if (status) {
      const allowedStatuses = ['waiting', 'dispatched', 'admitted'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Invalid status query '${status}'. Allowed values: ${allowedStatuses.join(', ')}`,
        });
      }
      filter.status = status;
    }

    const query = Case.find(filter)
      .populate('assignedHospital', 'name locality district availableBeds availableIcuBeds oxygenStatus')
      .populate('assignedAmbulance', 'driverName vehicleId status currentLocation')
      .sort(sortBy === 'severity' ? { severityScore: -1, createdAt: -1 } : { createdAt: -1 });

    if (limit) {
      query.limit(Number(limit));
    }

    const cases = await query.exec();

    return res.status(200).json({
      success: true,
      count: cases.length,
      filter: filter.status || 'all',
      data: cases,
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve cases',
    });
  }
};

/**
 * @desc    Get single case by ID with populated assignedHospital & assignedAmbulance
 * @route   GET /api/cases/:id
 * @access  Public
 */
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Case ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const emergencyCase = await Case.findById(id)
      .populate(
        'assignedHospital',
        'name locality district lat lng availableBeds totalBeds icuBeds availableIcuBeds oxygenStatus'
      )
      .populate('assignedAmbulance', 'driverName vehicleId status currentLocation');

    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Emergency case not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: emergencyCase,
    });
  } catch (error) {
    console.error(`Error fetching case ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve case details',
    });
  }
};

/**
 * @desc    Triage an existing case: calculates score from symptoms & age and updates case (Day 7)
 * @route   POST /api/cases/:id/triage
 * @access  Public
 */
const triageExistingCase = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Case ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const emergencyCase = await Case.findById(id);
    if (!emergencyCase) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Case not found with ID: ${id}`,
      });
    }

    // Run triage scoring algorithm
    const triageResult = calculateTriageScore(emergencyCase.symptomTags, emergencyCase.age);

    emergencyCase.severityScore = triageResult.severityScore;
    await emergencyCase.save();

    // Day 21: Real-time Socket.IO emission
    emitCaseUpdated(emergencyCase);

    return res.status(200).json({
      success: true,
      message: `Triage evaluation complete. Severity Score: ${triageResult.severityScore}/10 (${triageResult.tier})`,
      data: emergencyCase,
      triageDetails: triageResult,
    });
  } catch (error) {
    console.error(`Error in triage for case ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to evaluate case triage',
    });
  }
};

/**
 * @desc    Dispatch case to best hospital and nearest idle ambulance (Day 8, 9, 10)
 * @route   POST /api/cases/:id/dispatch
 * @access  Public
 */
const dispatchEmergencyCase = async (req, res) => {
  try {
    const { id } = req.params;
    const method = req.query.method || req.body.method || 'priority';

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Case ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const result = await dispatchCase(id, method);

    return res.status(200).json({
      success: true,
      message: `Emergency dispatch initiated using ${result.allocationDetails.method.toUpperCase()} algorithm.`,
      data: result.case,
      dispatchLog: result.dispatchLog,
      allocationDetails: result.allocationDetails,
    });
  } catch (error) {
    console.error(`Error in dispatch for case ${req.params.id}:`, error);
    return res.status(400).json({
      success: false,
      error: 'Dispatch Error',
      message: error.message,
    });
  }
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  triageExistingCase,
  dispatchEmergencyCase,
};
