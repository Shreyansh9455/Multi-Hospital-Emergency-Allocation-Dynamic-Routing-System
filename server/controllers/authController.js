const jwt = require('jsonwebtoken');
const { User, Hospital, Ambulance } = require('../models');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public (or Admin)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role, assignedHospital, assignedAmbulance } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Name, email, and password are required',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Error',
        message: `A user with email '${email}' already exists`,
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'districtAdmin',
      assignedHospital: assignedHospital || null,
      assignedAmbulance: assignedAmbulance || null,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedHospital: user.assignedHospital,
        assignedAmbulance: user.assignedAmbulance,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to register user',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Please provide both email and password',
      });
    }

    // Find user and explicitly select password
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('assignedHospital', 'name locality')
      .populate('assignedAmbulance', 'vehicleId driverName');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Error',
        message: 'Invalid email credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Error',
        message: 'Invalid password credentials',
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedHospital: user.assignedHospital,
        assignedAmbulance: user.assignedAmbulance,
      },
    });
  } catch (error) {
    console.error('Error in user login:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to process login request',
    });
  }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private (Protected)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('assignedHospital', 'name locality district')
      .populate('assignedAmbulance', 'vehicleId driverName status');

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch user profile',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
