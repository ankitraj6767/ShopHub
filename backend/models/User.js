import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  postalCode: { type: String },
  country: { type: String, default: 'USA' },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      maxlength: [20, 'Phone number cannot be longer than 20 characters'],
    },
    address: addressSchema,
    role: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer',
    },
    refreshTokens: [
      {
        token: String,
        createdAt: { type: Date, default: Date.now, expires: '7d' },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Password reset fields
    resetPasswordOTP: {
      type: String,
      select: false,
    },
    resetPasswordOTPExpires: {
      type: Date,
      select: false,
    },
    // Wallet balance (in rupees)
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Premium subscription status
    isPremium: {
      type: Boolean,
      default: false,
    },
    walletHistory: [
      {
        type: {
          type: String,
          enum: ['credit', 'debit'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        description: String,
        orderId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Order',
        },
        pointsRedeemed: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Add refresh token
userSchema.methods.addRefreshToken = async function (token) {
  // Initialize refreshTokens if undefined
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  // Limit to 5 refresh tokens (5 devices)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }
  this.refreshTokens.push({ token });
  await this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function (token) {
  // Initialize refreshTokens if undefined
  if (!this.refreshTokens) {
    this.refreshTokens = [];
  }
  this.refreshTokens = this.refreshTokens.filter((t) => t.token !== token);
  await this.save();
};

// Check if refresh token exists
userSchema.methods.hasRefreshToken = function (token) {
  // Return false if refreshTokens is undefined
  if (!this.refreshTokens) {
    return false;
  }
  return this.refreshTokens.some((t) => t.token === token);
};

const User = mongoose.model('User', userSchema);

export default User;
