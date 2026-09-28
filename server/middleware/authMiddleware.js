const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'med_dispatch_varanasi_super_secret_jwt_key_2026';

/**
 * Protects routes by verifying the JWT in Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not Authorized',
      message: 'Access denied. No authentication token provided in Authorization header.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not Authorized',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT verification error:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Not Authorized',
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

/**
 * Authorize specific roles (e.g. 'districtAdmin', 'hospitalStaff', 'ambulanceDriver')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

/**
 * Validates that hospital staff can only update their own assigned hospital (Day 25)
 */
const checkHospitalAccess = (req, res, next) => {
  if (req.user.role === 'districtAdmin') {
    return next();
  }

  if (req.user.role === 'hospitalStaff') {
    const hospitalId = req.params.id;
    if (
      !req.user.assignedHospital ||
      req.user.assignedHospital.toString() !== hospitalId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Hospital staff can only update capacity for their assigned hospital facility.',
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden',
    message: 'You do not have permission to update hospital resources.',
  });
};

module.exports = {
  protect,
  authorize,
  checkHospitalAccess,
  JWT_SECRET,
};
