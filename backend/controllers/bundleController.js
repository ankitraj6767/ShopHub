import asyncHandler from 'express-async-handler';
import ProductBundle from '../models/ProductBundle.js';
import Product from '../models/Product.js';

// @desc    Get all active bundles
// @route   GET /api/bundles
// @access  Public
export const getBundles = asyncHandler(async (req, res) => {
  const bundles = await ProductBundle.find({ isActive: true })
    .populate('products.product', 'name images price rating stock')
    .sort({ featured: -1, createdAt: -1 });

  res.json({
    success: true,
    data: bundles,
  });
});

// @desc    Get featured bundles
// @route   GET /api/bundles/featured
// @access  Public
export const getFeaturedBundles = asyncHandler(async (req, res) => {
  const bundles = await ProductBundle.find({ isActive: true, featured: true })
    .populate('products.product', 'name images price rating stock')
    .limit(4);

  res.json({
    success: true,
    data: bundles,
  });
});

// @desc    Get bundle by ID
// @route   GET /api/bundles/:id
// @access  Public
export const getBundleById = asyncHandler(async (req, res) => {
  const bundle = await ProductBundle.findById(req.params.id)
    .populate('products.product', 'name description images price rating numReviews stock');

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  res.json({
    success: true,
    data: bundle,
  });
});

// @desc    Create bundle
// @route   POST /api/bundles
// @access  Private/Admin
export const createBundle = asyncHandler(async (req, res) => {
  const { name, description, products, bundlePrice, discountPercentage, image, featured, isFeatured, validFrom, validUntil } = req.body;

  if (!products || products.length < 2) {
    res.status(400);
    throw new Error('Please add at least 2 products to create a bundle');
  }

  // Calculate original price from products
  let originalPrice = 0;
  const productData = [];

  for (const item of products) {
    // Support both 'product' and 'productId' field names
    const productId = item.product || item.productId;
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required for each product');
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product with ID ${productId} not found`);
    }
    originalPrice += product.price * (item.quantity || 1);
    productData.push({
      product: productId,
      quantity: item.quantity || 1,
    });
  }

  // Calculate bundle price from discount percentage if not provided
  let finalBundlePrice = bundlePrice;
  if (!finalBundlePrice && discountPercentage) {
    finalBundlePrice = originalPrice * (1 - discountPercentage / 100);
  }

  if (!finalBundlePrice || finalBundlePrice >= originalPrice) {
    res.status(400);
    throw new Error('Bundle price must be less than original price');
  }

  const bundle = await ProductBundle.create({
    name,
    description,
    products: productData,
    originalPrice,
    bundlePrice: Math.round(finalBundlePrice * 100) / 100,
    discountPercentage: discountPercentage || Math.round(((originalPrice - finalBundlePrice) / originalPrice) * 100),
    image,
    featured: featured || isFeatured || false,
    validFrom: validFrom ? new Date(validFrom) : undefined,
    validUntil: validUntil ? new Date(validUntil) : undefined,
  });

  res.status(201).json({
    success: true,
    data: bundle,
  });
});

// @desc    Update bundle
// @route   PUT /api/bundles/:id
// @access  Private/Admin
export const updateBundle = asyncHandler(async (req, res) => {
  let bundle = await ProductBundle.findById(req.params.id);

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  const { products, discountPercentage, isFeatured, featured } = req.body;

  // Recalculate original price if products changed
  if (products && products.length > 0) {
    let originalPrice = 0;
    const productData = [];
    
    for (const item of products) {
      const productId = item.product || item.productId;
      const product = await Product.findById(productId);
      if (product) {
        originalPrice += product.price * (item.quantity || 1);
        productData.push({
          product: productId,
          quantity: item.quantity || 1,
        });
      }
    }
    req.body.originalPrice = originalPrice;
    req.body.products = productData;
    
    // Recalculate bundle price if discount percentage provided
    if (discountPercentage) {
      req.body.bundlePrice = Math.round(originalPrice * (1 - discountPercentage / 100) * 100) / 100;
    }
  }

  // Handle featured field
  if (isFeatured !== undefined) {
    req.body.featured = isFeatured;
  }

  bundle = await ProductBundle.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('products.product', 'name images price');

  res.json({
    success: true,
    data: bundle,
  });
});

// @desc    Delete bundle
// @route   DELETE /api/bundles/:id
// @access  Private/Admin
export const deleteBundle = asyncHandler(async (req, res) => {
  const bundle = await ProductBundle.findById(req.params.id);

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  await bundle.deleteOne();

  res.json({
    success: true,
    message: 'Bundle deleted',
  });
});

// @desc    Add bundle to cart
// @route   POST /api/bundles/:id/add-to-cart
// @access  Private
export const addBundleToCart = asyncHandler(async (req, res) => {
  const bundle = await ProductBundle.findById(req.params.id)
    .populate('products.product');

  if (!bundle) {
    res.status(404);
    throw new Error('Bundle not found');
  }

  if (!bundle.isAvailable()) {
    res.status(400);
    throw new Error('Bundle is not available');
  }

  // Check stock for all products
  for (const item of bundle.products) {
    if (item.product.stock < item.quantity) {
      res.status(400);
      throw new Error(`${item.product.name} is out of stock`);
    }
  }

  // Return bundle data for cart
  res.json({
    success: true,
    data: {
      bundleId: bundle._id,
      name: bundle.name,
      products: bundle.products.map(item => ({
        product: item.product._id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      savings: bundle.savings,
    },
  });
});
