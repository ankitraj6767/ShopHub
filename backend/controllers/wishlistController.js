import asyncHandler from 'express-async-handler';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
export const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate({
    path: 'items.product',
    select: 'name price images stock rating numReviews category brand',
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, items: [] });
  }

  // Add price drop info
  const itemsWithPriceInfo = wishlist.items.map((item) => {
    const currentPrice = item.product?.price || 0;
    const priceDrop = item.priceWhenAdded - currentPrice;
    const priceDropPercentage =
      item.priceWhenAdded > 0
        ? ((priceDrop / item.priceWhenAdded) * 100).toFixed(1)
        : 0;

    return {
      ...item.toObject(),
      currentPrice,
      priceDrop: priceDrop > 0 ? priceDrop : 0,
      priceDropPercentage: priceDrop > 0 ? priceDropPercentage : 0,
      isInStock: item.product?.stock > 0,
    };
  });

  res.json({
    success: true,
    data: {
      ...wishlist.toObject(),
      items: itemsWithPriceInfo,
    },
    count: wishlist.items.length,
  });
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId, notifyOnPriceDrop, notifyOnBackInStock } = req.body;

  // Validate product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (!product.isActive) {
    res.status(400);
    throw new Error('Product is not available');
  }

  let wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: req.user._id,
      items: [],
    });
  }

  // Check if product already in wishlist
  const existingItem = wishlist.items.find(
    (item) => item.product.toString() === productId
  );

  if (existingItem) {
    res.status(400);
    throw new Error('Product already in wishlist');
  }

  wishlist.items.push({
    product: productId,
    priceWhenAdded: product.price,
    notifyOnPriceDrop: notifyOnPriceDrop !== false,
    notifyOnBackInStock: notifyOnBackInStock !== false,
  });

  await wishlist.save();

  // Populate the items before returning
  await wishlist.populate({
    path: 'items.product',
    select: 'name images price stock brand category isActive',
  });

  res.status(201).json({
    success: true,
    message: 'Product added to wishlist',
    data: wishlist,
  });
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  const itemIndex = wishlist.items.findIndex(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Product not found in wishlist');
  }

  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  res.json({
    success: true,
    message: 'Product removed from wishlist',
  });
});

// @desc    Update wishlist item notification settings
// @route   PUT /api/wishlist/:productId
// @access  Private
export const updateWishlistItem = asyncHandler(async (req, res) => {
  const { notifyOnPriceDrop, notifyOnBackInStock } = req.body;
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  const item = wishlist.items.find(
    (item) => item.product.toString() === req.params.productId
  );

  if (!item) {
    res.status(404);
    throw new Error('Product not found in wishlist');
  }

  if (notifyOnPriceDrop !== undefined) {
    item.notifyOnPriceDrop = notifyOnPriceDrop;
  }
  if (notifyOnBackInStock !== undefined) {
    item.notifyOnBackInStock = notifyOnBackInStock;
  }

  await wishlist.save();

  res.json({
    success: true,
    message: 'Wishlist item updated',
    data: item,
  });
});

// @desc    Move wishlist item to cart
// @route   POST /api/wishlist/:productId/move-to-cart
// @access  Private
export const moveToCart = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist not found');
  }

  const itemIndex = wishlist.items.findIndex(
    (item) => item.product.toString() === req.params.productId
  );

  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Product not found in wishlist');
  }

  const product = await Product.findById(req.params.productId);
  if (!product || !product.isActive) {
    res.status(400);
    throw new Error('Product is not available');
  }

  if (product.stock === 0) {
    res.status(400);
    throw new Error('Product is out of stock');
  }

  // Remove from wishlist
  wishlist.items.splice(itemIndex, 1);
  await wishlist.save();

  res.json({
    success: true,
    message: 'Product ready to add to cart',
    data: {
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url,
        stock: product.stock,
      },
    },
  });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
export const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  if (wishlist) {
    wishlist.items = [];
    await wishlist.save();
  }

  res.json({
    success: true,
    message: 'Wishlist cleared',
  });
});

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
export const checkWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });

  const isInWishlist =
    wishlist?.items.some(
      (item) => item.product.toString() === req.params.productId
    ) || false;

  res.json({
    success: true,
    data: { isInWishlist },
  });
});
