const mongoose = require('mongoose');
const { Ambulance, Case, DispatchLog } = require('../models');
const { emitAmbulanceUpdated, emitCaseUpdated } = require('../services/socketService');

/**
 * @desc    Get all ambulances (supports ?status= query filter)
 * @route   GET /api/ambulances
 * @access  Public
 */
const getAllAmbulances = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status) {
      const allowed = ['idle', 'enroute', 'busy'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Invalid status query '${status}'. Allowed values: ${allowed.join(', ')}`,
        });
      }
      filter.status = status;
    }

    const ambulances = await Ambulance.find(filter)
      .populate('assignedCase', 'patientName age severityScore status location')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: ambulances.length,
      data: ambulances,
    });
  } catch (error) {
    console.error('Error fetching ambulances:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve ambulances',
    });
  }
};

/**
 * @desc    Get single ambulance by ID
 * @route   GET /api/ambulances/:id
 * @access  Public
 */
const getAmbulanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Ambulance ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const ambulance = await Ambulance.findById(id).populate(
      'assignedCase',
      'patientName age severityScore status location assignedHospital'
    );

    if (!ambulance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Ambulance not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: ambulance,
    });
  } catch (error) {
    console.error(`Error fetching ambulance ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve ambulance details',
    });
  }
};

/**
 * @desc    Create a new ambulance
 * @route   POST /api/ambulances
 * @access  Public
 */
const createAmbulance = async (req, res) => {
  try {
    const { driverName, vehicleId, currentLocation, status } = req.body;

    // Validation: driverName
    if (!driverName || typeof driverName !== 'string' || driverName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'driverName is required and cannot be empty',
      });
    }

    // Validation: vehicleId
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'vehicleId is required and cannot be empty',
      });
    }

    // Check duplicate vehicleId
    const existing = await Ambulance.findOne({ vehicleId: vehicleId.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Error',
        message: `Ambulance with vehicleId '${vehicleId}' already exists`,
      });
    }

    // Validation: currentLocation
    if (!currentLocation || typeof currentLocation !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'currentLocation object with lat and lng is required',
      });
    }

    if (
      currentLocation.lat === undefined ||
      currentLocation.lng === undefined ||
      isNaN(Number(currentLocation.lat)) ||
      isNaN(Number(currentLocation.lng))
    ) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'currentLocation.lat and currentLocation.lng must be valid numbers',
      });
    }

    // Validation: status
    if (status) {
      const allowed = ['idle', 'enroute', 'busy'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `status must be one of: ${allowed.join(', ')}`,
        });
      }
    }

    const ambulance = new Ambulance({
      driverName: driverName.trim(),
      vehicleId: vehicleId.trim().toUpperCase(),
      currentLocation: {
        lat: Number(currentLocation.lat),
        lng: Number(currentLocation.lng),
      },
      status: status || 'idle',
      assignedCase: null,
    });

    const saved = await ambulance.save();

    // Day 21: Real-time Socket.IO emission
    emitAmbulanceUpdated(saved);

    return res.status(201).json({
      success: true,
      message: 'Ambulance registered successfully',
      data: saved,
    });
  } catch (error) {
    console.error('Error creating ambulance:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to create ambulance',
    });
  }
};

/**
 * @desc    Update ambulance currentLocation and/or status
 * @route   PUT /api/ambulances/:id
 * @access  Public
 */
const updateAmbulance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Ambulance ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const ambulance = await Ambulance.findById(id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Ambulance not found with ID: ${id}`,
      });
    }

    const { currentLocation, status, driverName } = req.body;
    const updates = {};

    if (driverName && typeof driverName === 'string') {
      updates.driverName = driverName.trim();
    }

    if (currentLocation) {
      if (
        currentLocation.lat === undefined ||
        currentLocation.lng === undefined ||
        isNaN(Number(currentLocation.lat)) ||
        isNaN(Number(currentLocation.lng))
      ) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'currentLocation.lat and currentLocation.lng must be valid numbers',
        });
      }
      updates.currentLocation = {
        lat: Number(currentLocation.lat),
        lng: Number(currentLocation.lng),
      };
    }

    if (status) {
      const allowed = ['idle', 'enroute', 'busy'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `status must be one of: ${allowed.join(', ')}`,
        });
      }
      updates.status = status;
    }

    const updated = await Ambulance.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('assignedCase');

    // Day 21: Real-time Socket.IO emission
    emitAmbulanceUpdated(updated);

    return res.status(200).json({
      success: true,
      message: 'Ambulance updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error(`Error updating ambulance ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to update ambulance',
    });
  }
};

/**
 * @desc    Update ambulance status with arrival lifecycle handler (Day 10)
 * @route   PUT /api/ambulances/:id/status
 * @access  Public
 */
const updateAmbulanceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Ambulance ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const allowed = ['arrived', 'idle', 'enroute', 'busy'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `status is required and must be one of: ${allowed.join(', ')}`,
      });
    }

    const ambulance = await Ambulance.findById(id);
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Ambulance not found with ID: ${id}`,
      });
    }

    const arrivalTime = new Date();
    let updatedCase = null;
    let updatedLog = null;

    if (status === 'arrived') {
      // If ambulance is linked to an active case
      if (ambulance.assignedCase) {
        const caseId = ambulance.assignedCase;

        // 1. Update Case status to 'admitted'
        updatedCase = await Case.findByIdAndUpdate(
          caseId,
          { $set: { status: 'admitted' } },
          { new: true }
        ).populate('assignedHospital').populate('assignedAmbulance');

        // Day 21: Broadcast case status update
        if (updatedCase) {
          emitCaseUpdated(updatedCase);
        }

        // 2. Find and update DispatchLog
        const dispatchLog = await DispatchLog.findOne({
          caseId: caseId,
          ambulanceId: ambulance._id,
        }).sort({ createdAt: -1 });

        if (dispatchLog) {
          const dispatchTime = dispatchLog.dispatchTime || dispatchLog.createdAt;
          const waitTimeMinutes = Math.max(
            1,
            Math.round((arrivalTime.getTime() - new Date(dispatchTime).getTime()) / (1000 * 60))
          );

          dispatchLog.arrivalTime = arrivalTime;
          dispatchLog.treatmentStartTime = arrivalTime;
          dispatchLog.waitTimeMinutes = waitTimeMinutes;
          await dispatchLog.save();
          updatedLog = dispatchLog;
        }
      }

      // Reset ambulance to 'idle' and clear assigned case
      ambulance.status = 'idle';
      ambulance.assignedCase = null;
      await ambulance.save();

      // Day 21: Broadcast ambulance status update
      emitAmbulanceUpdated(ambulance);

      return res.status(200).json({
        success: true,
        message: 'Ambulance marked as ARRIVED. Case status updated to ADMITTED & DispatchLog closed.',
        data: {
          ambulance,
          case: updatedCase,
          dispatchLog: updatedLog,
        },
      });
    } else if (status === 'idle') {
      ambulance.status = 'idle';
      ambulance.assignedCase = null;
      await ambulance.save();

      // Day 21: Broadcast ambulance status update
      emitAmbulanceUpdated(ambulance);

      return res.status(200).json({
        success: true,
        message: 'Ambulance status reset to idle',
        data: { ambulance },
      });
    } else {
      ambulance.status = status;
      await ambulance.save();

      // Day 21: Broadcast ambulance status update
      emitAmbulanceUpdated(ambulance);

      return res.status(200).json({
        success: true,
        message: `Ambulance status updated to ${status}`,
        data: { ambulance },
      });
    }
  } catch (error) {
    console.error(`Error updating ambulance status ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to update ambulance status',
    });
  }
};

module.exports = {
  getAllAmbulances,
  getAmbulanceById,
  createAmbulance,
  updateAmbulance,
  updateAmbulanceStatus,
};
