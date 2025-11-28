import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import config from '../config/config.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/authMiddleware.js';
import { sendEmail, emailTemplates } from '../utils/email.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  if (user) {
    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    await user.addRefreshToken(refreshToken);

    // Set cookies
    setTokenCookies(res, accessToken, refreshToken);

    // Send welcome email in background (don't await)
    sendEmail({
      to: user.email,
      subject: emailTemplates.welcomeEmail(user).subject,
      html: emailTemplates.welcomeEmail(user).html,
    }).catch((emailError) => {
      console.error('Failed to send welcome email:', emailError);
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessToken,
      },
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated');
  }

  // Check password
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  await user.addRefreshToken(refreshToken);

  // Set cookies
  setTokenCookies(res, accessToken, refreshToken);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
    },
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken && req.user) {
      // Remove refresh token from user's stored tokens
      await req.user.removeRefreshToken(refreshToken);
    }
  } catch (error) {
    // Ignore errors when removing refresh token - user might not exist or token might be invalid
    console.log('Error removing refresh token:', error.message);
  }

  // Clear cookies regardless of any errors
  res.cookie('accessToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    res.status(401);
    throw new Error('No refresh token provided');
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user || !user.hasRefreshToken(refreshToken)) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    if (!user.isActive) {
      res.status(401);
      throw new Error('Account is deactivated');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    // Set new access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.cookieSecure,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.json({
      success: true,
      data: {
        accessToken,
      },
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// Helper function to set token cookies
const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Forgot password - Send OTP to email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email address');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    res.status(404);
    throw new Error('No account found with this email address');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated');
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to user
  user.resetPasswordOTP = otp;
  user.resetPasswordOTPExpires = otpExpires;
  await user.save({ validateBeforeSave: false });

  // Send response immediately, then send email
  res.json({
    success: true,
    message: 'OTP sent to your email address',
  });

  // Send OTP email in background (fire-and-forget for faster response)
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🔐 Password Reset</h1>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Your OTP code is:</p>
        <div style="background: #fff; border: 2px dashed #667eea; padding: 15px; text-align: center; margin: 15px 0; border-radius: 10px;">
          <span style="font-size: 28px; font-weight: bold; color: #667eea; letter-spacing: 5px;">${otp}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Valid for 10 minutes. Never share this OTP.</p>
      </div>
    </div>
  `;

  sendEmail({
    to: user.email,
    subject: 'Password Reset OTP - ShopHub',
    html: emailHtml,
  }).catch(async (error) => {
    console.error('Failed to send OTP email:', error.message);
    // Clear OTP if email fails (user won't receive it)
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
  });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Please provide email and OTP');
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+resetPasswordOTP +resetPasswordOTPExpires');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
    res.status(400);
    throw new Error('No OTP request found. Please request a new OTP.');
  }

  if (user.resetPasswordOTPExpires < Date.now()) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(400);
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (user.resetPasswordOTP !== otp) {
    res.status(400);
    throw new Error('Invalid OTP. Please try again.');
  }

  res.json({
    success: true,
    message: 'OTP verified successfully',
  });
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    res.status(400);
    throw new Error('Please provide email, OTP, and new password');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  }).select('+resetPasswordOTP +resetPasswordOTPExpires +password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
    res.status(400);
    throw new Error('No OTP request found. Please request a new OTP.');
  }

  if (user.resetPasswordOTPExpires < Date.now()) {
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.status(400);
    throw new Error('OTP has expired. Please request a new one.');
  }

  if (user.resetPasswordOTP !== otp) {
    res.status(400);
    throw new Error('Invalid OTP');
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordOTP = undefined;
  user.resetPasswordOTPExpires = undefined;
  await user.save();

  // Send confirmation email
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-icon { font-size: 48px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <p class="success-icon">✅</p>
            <h1>Password Changed</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your password has been successfully changed.</p>
            <p>If you did not make this change, please contact our support team immediately.</p>
            <p style="margin-top: 20px;">
              <a href="${config.frontendUrl}/login" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login Now</a>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ShopHub. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully - ShopHub',
      html: emailHtml,
    });
  } catch (error) {
    console.error('Failed to send password change confirmation email:', error);
  }

  res.json({
    success: true,
    message: 'Password reset successfully. You can now login with your new password.',
  });
});
