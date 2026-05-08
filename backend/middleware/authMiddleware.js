const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_estimation_key_2026');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'Account is inactive or not found' });
      }

      const programId = req.headers['x-program-id'];
      
      if (programId && programId !== 'null' && programId !== 'undefined' && mongoose.Types.ObjectId.isValid(programId)) {
        req.programId = programId;
      } else {
        req.programId = null;
      }
      return next();
    } catch (error) {
      console.error('AUTH_PROTECT_ERROR:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const restrictToView = (req, res, next) => {
  if (req.user && req.user.role === 'viewer') {
    if (req.method !== 'GET') {
      return res.status(403).json({ message: 'Permission denied: View-only access' });
    }
  }
  next();
};

const verifyProgramAccess = (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();
    
    if (!req.programId) {
      return res.status(400).json({ message: 'No program ID provided in headers' });
    }

    const hasAccess = req.user.programAccess.some(pId => pId.toString() === req.programId.toString());
    
    if (hasAccess) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied to this program' });
    }
  } catch (error) {
    console.error('VERIFY_PROGRAM_ACCESS_ERROR:', error);
    res.status(500).json({ message: 'Internal Server error in access verification' });
  }
};

module.exports = { protect, admin, restrictToView, verifyProgramAccess };
