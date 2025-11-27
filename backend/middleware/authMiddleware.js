import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import config from '../config/config.js';

// Protect routes - verify access token
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, config.jwtAccessSecret);
    req.user = await User.findById(decoded.id).select('-refreshTokens');

    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    if (!req.user.isActive) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }
});

// Admin only middleware
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwtAccessSecret);
      req.user = await User.findById(decoded.id).select('-refreshTokens');
    } catch (error) {
      // Token invalid, continue without user
      req.user = null;
    }
  }

  next();
});

// Generate access token
export const generateAccessToken = (id) => {
  return jwt.sign({ id }, config.jwtAccessSecret, {
    expiresIn: config.jwtAccessExpire,
  });
};

// Generate refresh token
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpire,
  });
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwtRefreshSecret);
};
