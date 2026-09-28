const mongoose = require('mongoose');
const { Hospital } = require('../models');
const { emitHospitalUpdated } = require('../services/socketService');

/**
 * @desc    Get all hospitals
 * @route   GET /api/hospitals
 * @access  Public
 */
const getAllHospitals = async (req, res) => {
  try {
    const { district, locality, minAvailableBeds, ayushman } = req.query;
    const filter = {};

    if (district) {
      filter.district = new RegExp(district, 'i');
    }
    if (locality) {
      filter.locality = new RegExp(locality, 'i');
    }
    if (minAvailableBeds !== undefined) {
      filter.availableBeds = { $gte: Number(minAvailableBeds) };
    }
    if (ayushman !== undefined) {
      filter.ayushmanEmpanelled = ayushman === 'true';
    }

    const hospitals = await Hospital.find(filter).sort({ availableBeds: -1 });

    return res.status(200).json({
      success: true,
      count: hospitals.length,
      data: hospitals,
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve hospitals',
    });
  }
};

/**
 * @desc    Get single hospital by ID
 * @route   GET /api/hospitals/:id
 * @access  Public
 */
const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Hospital ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const hospital = await Hospital.findById(id);

    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Hospital not found with ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (error) {
    console.error(`Error fetching hospital ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to retrieve hospital',
    });
  }
};

/**
 * @desc    Update hospital bed/ICU/oxygen/ventilator counts
 * @route   PUT /api/hospitals/:id
 * @access  Protected (Admin or Assigned Hospital Staff)
 */
const updateHospital = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: `Hospital ID '${id}' is not a valid MongoDB ObjectId`,
      });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Hospital not found with ID: ${id}`,
      });
    }

    const updates = { ...req.body };

    const totalBeds = updates.totalBeds !== undefined ? Number(updates.totalBeds) : hospital.totalBeds;
    const availableBeds = updates.availableBeds !== undefined ? Number(updates.availableBeds) : hospital.availableBeds;
    const icuBeds = updates.icuBeds !== undefined ? Number(updates.icuBeds) : hospital.icuBeds;
    const availableIcuBeds = updates.availableIcuBeds !== undefined ? Number(updates.availableIcuBeds) : hospital.availableIcuBeds;
    const ventilators = updates.ventilators !== undefined ? Number(updates.ventilators) : hospital.ventilators;
    const ventilatorsAvailable = updates.ventilatorsAvailable !== undefined ? Number(updates.ventilatorsAvailable) : hospital.ventilatorsAvailable;

    const negativeChecks = [
      { name: 'totalBeds', val: totalBeds },
      { name: 'availableBeds', val: availableBeds },
      { name: 'icuBeds', val: icuBeds },
      { name: 'availableIcuBeds', val: availableIcuBeds },
      { name: 'ventilators', val: ventilators },
      { name: 'ventilatorsAvailable', val: ventilatorsAvailable },
    ];

    for (const item of negativeChecks) {
      if (item.val < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `${item.name} cannot be negative (received ${item.val})`,
        });
      }
    }

    if (availableBeds > totalBeds) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `availableBeds (${availableBeds}) cannot exceed totalBeds (${totalBeds})`,
      });
    }

    if (availableIcuBeds > icuBeds) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `availableIcuBeds (${availableIcuBeds}) cannot exceed icuBeds (${icuBeds})`,
      });
    }

    if (ventilatorsAvailable > ventilators) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `ventilatorsAvailable (${ventilatorsAvailable}) cannot exceed total ventilators (${ventilators})`,
      });
    }

    if (updates.oxygenStatus) {
      const allowedO2 = ['adequate', 'low', 'critical'];
      if (!allowedO2.includes(updates.oxygenStatus)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `oxygenStatus must be one of: ${allowedO2.join(', ')}`,
        });
      }
    }

    updates.lastUpdated = new Date();

    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Day 21: Emit real-time hospitalUpdated event
    emitHospitalUpdated(updatedHospital);

    return res.status(200).json({
      success: true,
      message: 'Hospital updated successfully',
      data: updatedHospital,
    });
  } catch (error) {
    console.error(`Error updating hospital ${req.params.id}:`, error);

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
      message: 'Failed to update hospital',
    });
  }
};

module.exports = {
  getAllHospitals,
  getHospitalById,
  updateHospital,
};
