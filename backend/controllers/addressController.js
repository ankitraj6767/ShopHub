import asyncHandler from 'express-async-handler';
import Address from '../models/Address.js';

// @desc    Get user's addresses
// @route   GET /api/addresses
// @access  Private
export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({
    isDefault: -1,
    createdAt: -1,
  });

  res.json({
    success: true,
    data: addresses,
    count: addresses.length,
  });
});

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Private
export const getAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  res.json({
    success: true,
    data: address,
  });
});

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
export const createAddress = asyncHandler(async (req, res) => {
  const {
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country,
    addressType,
    isDefault,
    deliveryInstructions,
  } = req.body;

  // Check max addresses limit
  const addressCount = await Address.countDocuments({ user: req.user._id });
  if (addressCount >= 10) {
    res.status(400);
    throw new Error('Maximum 10 addresses allowed. Please delete an existing address.');
  }

  // If this is the first address or marked as default, set it as default
  const shouldBeDefault = addressCount === 0 || isDefault;

  const address = await Address.create({
    user: req.user._id,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    postalCode,
    country: country || 'United States',
    addressType: addressType || 'home',
    isDefault: shouldBeDefault,
    deliveryInstructions,
  });

  res.status(201).json({
    success: true,
    data: address,
  });
});

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = asyncHandler(async (req, res) => {
  let address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // Update fields
  address.fullName = req.body.fullName || address.fullName;
  address.phone = req.body.phone || address.phone;
  address.addressLine1 = req.body.addressLine1 || address.addressLine1;
  address.addressLine2 = req.body.addressLine2 ?? address.addressLine2;
  address.landmark = req.body.landmark ?? address.landmark;
  address.city = req.body.city || address.city;
  address.state = req.body.state || address.state;
  address.postalCode = req.body.postalCode || address.postalCode;
  address.country = req.body.country || address.country;
  address.addressType = req.body.addressType || address.addressType;
  address.deliveryInstructions =
    req.body.deliveryInstructions ?? address.deliveryInstructions;

  if (req.body.isDefault !== undefined) {
    address.isDefault = req.body.isDefault;
  }

  address = await address.save();

  res.json({
    success: true,
    data: address,
  });
});

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  const wasDefault = address.isDefault;

  await Address.deleteOne({ _id: address._id });

  // If deleted address was default, set another as default
  if (wasDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({
      createdAt: -1,
    });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  res.json({
    success: true,
    message: 'Address deleted',
  });
});

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }

  // Remove default from all other addresses
  await Address.updateMany(
    { user: req.user._id, _id: { $ne: address._id } },
    { isDefault: false }
  );

  address.isDefault = true;
  await address.save();

  res.json({
    success: true,
    message: 'Default address updated',
    data: address,
  });
});

// @desc    Get default address
// @route   GET /api/addresses/default
// @access  Private
export const getDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({
    user: req.user._id,
    isDefault: true,
  });

  res.json({
    success: true,
    data: address,
  });
});
