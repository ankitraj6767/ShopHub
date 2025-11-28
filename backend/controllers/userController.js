import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
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
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.address) {
      user.address = {
        ...user.address?.toObject(),
        ...req.body.address,
      };
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { email: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const count = await User.countDocuments({ ...keyword });
  const users = await User.find({ ...keyword })
    .select('-refreshTokens')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: users,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Get user by ID (admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-refreshTokens');

  if (user) {
    res.json({
      success: true,
      data: user,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive = req.body.isActive !== undefined ? req.body.isActive : user.isActive;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user role (admin)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
      },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
      res.status(400);
      throw new Error('Cannot delete admin user');
    }

    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: 'User removed',
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Get user wallet balance
// @route   GET /api/users/wallet
// @access  Private
export const getWalletBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: {
      balance: user.walletBalance || 0,
      history: (user.walletHistory || []).slice(-20).reverse(),
    },
  });
});

// @desc    Use wallet balance for order
// @route   POST /api/users/wallet/use
// @access  Private
export const useWalletBalance = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  const currentBalance = user.walletBalance || 0;
  
  if (amount > currentBalance) {
    res.status(400);
    throw new Error('Insufficient wallet balance');
  }

  // Deduct from wallet
  user.walletBalance = currentBalance - amount;
  user.walletHistory.push({
    type: 'debit',
    amount: amount,
    description: `Used for order${orderId ? ` #${orderId.toString().slice(-8).toUpperCase()}` : ''}`,
    orderId: orderId || null,
  });
  await user.save();

  res.json({
    success: true,
    message: `$${amount.toFixed(2)} deducted from wallet`,
    data: {
      amountUsed: amount,
      newBalance: user.walletBalance,
    },
  });
});
