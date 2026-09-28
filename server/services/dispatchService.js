const { Hospital, Ambulance, Case, DispatchLog } = require('../models');
const {
  emitHospitalUpdated,
  emitCaseUpdated,
  emitAmbulanceUpdated,
} = require('./socketService');

/**
 * Calculates straight-line great-circle distance between two GPS coordinates using Haversine formula.
 * @param {number} lat1 - Point 1 Latitude
 * @param {number} lon1 - Point 1 Longitude
 * @param {number} lat2 - Point 2 Latitude
 * @param {number} lon2 - Point 2 Longitude
 * @returns {number} Distance in kilometers
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Finds the best hospital for an emergency case.
 * Supports 'fifo' (nearest distance) and 'priority' (multi-criteria weighted optimization).
 *
 * @param {object} caseObj - Case document / object
 * @param {string} method - 'priority' (default) or 'fifo'
 * @returns {Promise<object>} { bestHospital, distanceKm, score, candidates, method }
 */
async function findBestHospital(caseObj, method = 'priority') {
  const isSevere = caseObj.severityScore !== null && caseObj.severityScore >= 7;

  // 1. Query candidate hospitals with capacity
  const filter = {
    availableBeds: { $gt: 0 },
  };

  // Severe patients (triage >= 7) require available ICU bed
  if (isSevere) {
    filter.availableIcuBeds = { $gt: 0 };
  }

  let candidates = await Hospital.find(filter);

  // If no ICU capacity found anywhere for critical patient, fallback to any available beds
  if (candidates.length === 0 && isSevere) {
    candidates = await Hospital.find({ availableBeds: { $gt: 0 } });
  }

  if (candidates.length === 0) {
    throw new Error('No hospitals with available bed capacity found in the network.');
  }

  const caseLat = caseObj.location.lat;
  const caseLng = caseObj.location.lng;

  // 2. Compute distances and candidate metrics
  const scoredCandidates = candidates.map((h) => {
    const distKm = haversineDistanceKm(caseLat, caseLng, h.lat, h.lng);
    const totalBeds = h.totalBeds > 0 ? h.totalBeds : 1;
    const occupancyRate = 1 - h.availableBeds / totalBeds; // 0 (empty) to 1 (full)

    // Oxygen penalty: 0 for adequate, 5 for low, 10 for critical
    let oxygenPenalty = 0;
    if (h.oxygenStatus === 'low') oxygenPenalty = 5;
    if (h.oxygenStatus === 'critical') oxygenPenalty = 10;

    // Day 9 Weighted Priority Formula:
    // score = (distanceKm * 0.4) + (occupancyRate * 100 * 0.4) + (oxygenPenalty * 0.2)
    const priorityScore = Number(
      (distKm * 0.4 + occupancyRate * 100 * 0.4 + oxygenPenalty * 0.2).toFixed(2)
    );

    return {
      hospital: h,
      distanceKm: distKm,
      occupancyRate: Number((occupancyRate * 100).toFixed(1)),
      oxygenPenalty,
      priorityScore,
    };
  });

  // 3. Filter within 15 km radius (expand if none found)
  let inRadius = scoredCandidates.filter((c) => c.distanceKm <= 15);
  if (inRadius.length === 0) {
    inRadius = scoredCandidates; // Fallback to all available
  }

  // 4. Select best based on method
  const normalizedMethod = String(method).toLowerCase() === 'fifo' ? 'fifo' : 'priority';

  let selected;
  if (normalizedMethod === 'fifo') {
    // Pure distance-based (FIFO nearest)
    inRadius.sort((a, b) => a.distanceKm - b.distanceKm);
    selected = inRadius[0];
  } else {
    // Multi-factor weighted priority
    inRadius.sort((a, b) => a.priorityScore - b.priorityScore);
    selected = inRadius[0];
  }

  return {
    bestHospital: selected.hospital,
    distanceKm: selected.distanceKm,
    priorityScore: selected.priorityScore,
    occupancyRate: selected.occupancyRate,
    method: normalizedMethod === 'fifo' ? 'FIFO' : 'priority',
    candidateCount: scoredCandidates.length,
    allCandidates: inRadius.map((c) => ({
      hospitalId: c.hospital._id,
      name: c.hospital.name,
      distanceKm: c.distanceKm,
      priorityScore: c.priorityScore,
      availableBeds: c.hospital.availableBeds,
      availableIcuBeds: c.hospital.availableIcuBeds,
      oxygenStatus: c.hospital.oxygenStatus,
    })),
  };
}

/**
 * Finds the nearest idle ambulance to the patient location (Day 10).
 * Assumes average speed of 30 km/h in city traffic.
 *
 * @param {object} caseLocation - { lat, lng }
 * @returns {Promise<object|null>} { bestAmbulance, distanceKm, etaMinutes }
 */
async function findNearestIdleAmbulance(caseLocation) {
  const idleAmbulances = await Ambulance.find({ status: 'idle' });

  if (idleAmbulances.length === 0) {
    return null; // No idle ambulances currently available
  }

  const scoredAmbulances = idleAmbulances.map((amb) => {
    const distKm = haversineDistanceKm(
      caseLocation.lat,
      caseLocation.lng,
      amb.currentLocation.lat,
      amb.currentLocation.lng
    );
    // Speed: 30 km/h -> ETA in minutes = (distanceKm / 30) * 60 = distanceKm * 2
    const etaMinutes = Math.max(1, Math.round((distKm / 30) * 60));
    return {
      ambulance: amb,
      distanceKm: distKm,
      etaMinutes,
    };
  });

  scoredAmbulances.sort((a, b) => a.distanceKm - b.distanceKm);
  return scoredAmbulances[0];
}

/**
 * Dispatches an emergency case end-to-end (Day 8, 9, 10).
 * 1. Evaluates best hospital (FIFO or Priority)
 * 2. Decrements hospital available bed & ICU capacity
 * 3. Finds and assigns nearest idle ambulance + computes ETA
 * 4. Logs dispatch event in DispatchLog
 *
 * @param {string} caseId
 * @param {string} method - 'priority' or 'fifo'
 * @returns {Promise<object>} Result payload
 */
async function dispatchCase(caseId, method = 'priority') {
  const emergencyCase = await Case.findById(caseId);
  if (!emergencyCase) {
    throw new Error(`Emergency case not found with ID: ${caseId}`);
  }

  if (emergencyCase.status === 'admitted') {
    throw new Error('Case is already admitted and cannot be redispatched.');
  }

  // 1. Find Best Hospital
  const hospitalResult = await findBestHospital(emergencyCase, method);
  const chosenHospital = hospitalResult.bestHospital;

  // 2. Decrement bed capacity
  const isSevere = emergencyCase.severityScore !== null && emergencyCase.severityScore >= 7;
  const hospitalUpdates = {
    $inc: { availableBeds: -1 },
    $set: { lastUpdated: new Date() },
  };

  if (isSevere && chosenHospital.availableIcuBeds > 0) {
    hospitalUpdates.$inc.availableIcuBeds = -1;
  }

  const updatedHospital = await Hospital.findByIdAndUpdate(
    chosenHospital._id,
    hospitalUpdates,
    { new: true }
  );

  // Day 21: Broadcast updated hospital bed capacity
  emitHospitalUpdated(updatedHospital);

  // 3. Find Nearest Idle Ambulance (Day 10)
  const ambulanceResult = await findNearestIdleAmbulance(emergencyCase.location);
  let assignedAmbulance = null;
  let etaMinutes = null;
  let estimatedArrival = null;

  if (ambulanceResult) {
    assignedAmbulance = ambulanceResult.ambulance;
    etaMinutes = ambulanceResult.etaMinutes;
    estimatedArrival = new Date(Date.now() + etaMinutes * 60 * 1000);

    // Update Ambulance status to 'enroute'
    const updatedAmbulance = await Ambulance.findByIdAndUpdate(
      assignedAmbulance._id,
      {
        $set: {
          status: 'enroute',
          assignedCase: emergencyCase._id,
        },
      },
      { new: true }
    );

    // Day 21: Broadcast ambulance status update
    emitAmbulanceUpdated(updatedAmbulance);
  }

  // 4. Update Case document
  emergencyCase.assignedHospital = updatedHospital._id;
  if (assignedAmbulance) {
    emergencyCase.assignedAmbulance = assignedAmbulance._id;
    emergencyCase.etaMinutes = etaMinutes;
    emergencyCase.estimatedArrival = estimatedArrival;
  }
  emergencyCase.status = 'dispatched';
  await emergencyCase.save();

  // 5. Create DispatchLog entry
  const dispatchLog = new DispatchLog({
    caseId: emergencyCase._id,
    hospitalId: updatedHospital._id,
    ambulanceId: assignedAmbulance ? assignedAmbulance._id : null,
    dispatchTime: new Date(),
    method: hospitalResult.method,
  });
  await dispatchLog.save();

  // Return full populated case details
  const populatedCase = await Case.findById(emergencyCase._id)
    .populate('assignedHospital')
    .populate('assignedAmbulance');

  // Day 21: Broadcast dispatched case document
  emitCaseUpdated(populatedCase);

  return {
    case: populatedCase,
    dispatchLog,
    allocationDetails: {
      method: hospitalResult.method,
      hospital: {
        id: updatedHospital._id,
        name: updatedHospital.name,
        locality: updatedHospital.locality,
        remainingBeds: updatedHospital.availableBeds,
        remainingIcuBeds: updatedHospital.availableIcuBeds,
        distanceKm: hospitalResult.distanceKm,
        priorityScore: hospitalResult.priorityScore,
      },
      ambulance: assignedAmbulance
        ? {
            id: assignedAmbulance._id,
            vehicleId: assignedAmbulance.vehicleId,
            driverName: assignedAmbulance.driverName,
            distanceKm: ambulanceResult.distanceKm,
            etaMinutes,
            estimatedArrival,
          }
        : null,
    },
  };
}

module.exports = {
  haversineDistanceKm,
  findBestHospital,
  findNearestIdleAmbulance,
  dispatchCase,
};
