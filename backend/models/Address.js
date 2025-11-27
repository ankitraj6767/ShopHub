import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fullName: {
      type: String,
      required: [true, 'Please add full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Please add phone number'],
      match: [/^[+]?[\d\s-()]{10,}$/, 'Please add a valid phone number'],
    },
    addressLine1: {
      type: String,
      required: [true, 'Please add address line 1'],
      maxlength: [200, 'Address line 1 cannot exceed 200 characters'],
    },
    addressLine2: {
      type: String,
      maxlength: [200, 'Address line 2 cannot exceed 200 characters'],
    },
    landmark: {
      type: String,
      maxlength: [100, 'Landmark cannot exceed 100 characters'],
    },
    city: {
      type: String,
      required: [true, 'Please add city'],
      maxlength: [50, 'City cannot exceed 50 characters'],
    },
    state: {
      type: String,
      required: [true, 'Please add state'],
      maxlength: [50, 'State cannot exceed 50 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Please add postal code'],
      match: [/^[0-9]{5,10}$/, 'Please add a valid postal code'],
    },
    country: {
      type: String,
      required: [true, 'Please add country'],
      default: 'United States',
      maxlength: [50, 'Country cannot exceed 50 characters'],
    },
    addressType: {
      type: String,
      enum: ['home', 'office', 'other'],
      default: 'home',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    deliveryInstructions: {
      type: String,
      maxlength: [500, 'Delivery instructions cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user lookup
addressSchema.index({ user: 1 });

// Pre-save middleware to handle default address
addressSchema.pre('save', async function (next) {
  if (this.isDefault) {
    // Set all other addresses for this user to non-default
    await this.constructor.updateMany(
      { user: this.user, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Static method to get user's default address
addressSchema.statics.getDefaultAddress = async function (userId) {
  return this.findOne({ user: userId, isDefault: true });
};

const Address = mongoose.model('Address', addressSchema);
export default Address;
