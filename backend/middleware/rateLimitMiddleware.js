import rateLimit from 'express-rate-limit';

// General API rate limiter - very lenient for development
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 1000, // 1000 requests per minute - very lenient for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again shortly',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Validate is disabled to prevent errors with proxy headers
  validate: { trustProxy: false, xForwardedForHeader: false },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

// Auth rate limiter - lenient for development
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 attempts per minute - very lenient for development
  message: {
    success: false,
    message: 'Too many login attempts, please try again shortly',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Validate is disabled to prevent errors with proxy headers
  validate: { trustProxy: false, xForwardedForHeader: false },
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  },
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false, xForwardedForHeader: false },
});

// Order creation limiter
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 orders per hour
  message: {
    success: false,
    message: 'Too many orders from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
