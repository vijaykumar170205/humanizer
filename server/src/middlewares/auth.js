import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Protect routes: verifies JWT from Authorization header or HTTP-only cookies
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // 2. Fallback to cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return errorResponse(res, 'Authentication required. Please log in to access this resource.', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Retrieve user and check if active
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(res, 'The account belonging to this token no longer exists.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Your session has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid authentication token. Please log in again.', 401);
  }
};

/**
 * Optional Auth: Attaches user if valid token exists, but does not block guests
 */
export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id).select('-password');
    req.user = user || null;
  } catch (error) {
    req.user = null;
  }
  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized. Please log in.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Access denied. Requires '${roles.join(', ')}' role.`, 403);
    }

    next();
  };
};
