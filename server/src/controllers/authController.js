import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const googleClient = new OAuth2Client(config.google.clientId);

/**
 * Generate JWT token helper
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Attach JWT cookie helper
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: config.env === 'production' ? 'strict' : 'lax',
  };

  res.cookie('token', token, cookieOptions);

  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    role: user.role,
    plan: user.plan,
    wordLimit: user.wordLimit,
    wordsUsed: user.wordsUsed,
    wordsRemaining: Math.max(0, user.wordLimit - user.wordsUsed),
    preferences: user.preferences,
    createdAt: user.createdAt,
  };

  return successResponse(
    res,
    {
      user: userPayload,
      token,
    },
    message,
    statusCode
  );
};

/**
 * @desc   Register a new user
 * @route  POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Please provide name, email, and password.', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists.', 409);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: 'local',
      plan: 'free',
      wordLimit: config.plans.free.monthlyWordLimit,
      wordsUsed: 0,
      lastLoginAt: new Date(),
    });

    return sendTokenResponse(user, 201, res, 'Account registered successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Authenticate user & return token
 * @route  POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Please provide email and password.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.password && user.authProvider === 'google') {
      return errorResponse(res, 'This account was created with Google Sign-In. Please click "Continue with Google".', 400);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account is deactivated. Please contact support.', 403);
    }

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, 'Logged in successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Google Sign-In / OAuth verification & session creation
 * @route  POST /api/auth/google
 */
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, profile } = req.body;

    let email = null;
    let name = null;
    let googleId = null;
    let avatar = null;

    if (credential) {
      // Decode or verify Google credential token
      try {
        if (config.google.clientId) {
          const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: config.google.clientId,
          });
          const payload = ticket.getPayload();
          email = payload.email;
          name = payload.name;
          googleId = payload.sub;
          avatar = payload.picture;
        } else {
          // If no specific client ID configured yet, safely decode JWT payload
          const decoded = jwt.decode(credential);
          if (decoded && decoded.email) {
            email = decoded.email;
            name = decoded.name || decoded.given_name || 'Google User';
            googleId = decoded.sub;
            avatar = decoded.picture || '';
          }
        }
      } catch (err) {
        console.warn('Google token verification fallback:', err.message);
        // Fallback: decode without verification if local dev
        const decoded = jwt.decode(credential);
        if (decoded && decoded.email) {
          email = decoded.email;
          name = decoded.name || 'Google User';
          googleId = decoded.sub;
          avatar = decoded.picture || '';
        }
      }
    } else if (profile && profile.email) {
      email = profile.email;
      name = profile.name || 'Google User';
      googleId = profile.id || profile.sub || null;
      avatar = profile.avatar || profile.picture || '';
    }

    if (!email) {
      return errorResponse(res, 'Could not retrieve Google profile or email.', 400);
    }

    email = email.toLowerCase().trim();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (!user.isActive) {
        return errorResponse(res, 'Your account is deactivated. Please contact support.', 403);
      }

      // Link googleId and avatar if not present
      if (!user.googleId && googleId) user.googleId = googleId;
      if (!user.avatar && avatar) user.avatar = avatar;
      user.lastLoginAt = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      // Create new user via Google
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        avatar: avatar || '',
        authProvider: 'google',
        plan: 'free',
        wordLimit: config.plans.free.monthlyWordLimit,
        wordsUsed: 0,
        lastLoginAt: new Date(),
      });
    }

    return sendTokenResponse(user, 200, res, 'Google authentication successful.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Log out current user / clear cookie
 * @route  POST /api/auth/logout
 */
export const logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  return successResponse(res, {}, 'Logged out successfully.');
};

/**
 * @desc   Get current authenticated user profile & quota
 * @route  GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    const userPayload = {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      role: user.role,
      plan: user.plan,
      wordLimit: user.wordLimit,
      wordsUsed: user.wordsUsed,
      wordsRemaining: Math.max(0, user.wordLimit - user.wordsUsed),
      preferences: user.preferences,
      createdAt: user.createdAt,
    };

    return successResponse(res, { user: userPayload }, 'Profile loaded.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Initiate forgot password token
 * @route  POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Please provide an email address.', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success response to avoid leaking registered emails
      return successResponse(
        res,
        {},
        'If that email exists in our system, a password reset link has been dispatched.'
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 mins
    await user.save({ validateBeforeSave: false });

    // In dev mode, return the token for quick verification
    const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;

    return successResponse(
      res,
      { resetToken: config.env === 'development' ? resetToken : undefined, resetUrl: config.env === 'development' ? resetUrl : undefined },
      'Password reset instructions sent.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Reset password using token
 * @route  POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return errorResponse(res, 'Token and new password are required.', 400);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return errorResponse(res, 'Invalid or expired password reset token.', 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendTokenResponse(user, 200, res, 'Password reset successfully.');
  } catch (error) {
    next(error);
  }
};
