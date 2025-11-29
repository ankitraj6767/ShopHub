import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';
import { notifyNewProduct, notifyPriceDrop, notifyBackInStock } from './notificationController.js';

// @desc    Get all products with filters, search, sort, pagination
// @route   GET /api/products
// @access  Public
export const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isActive: true };

  // Search by keyword
  if (req.query.keyword) {
    query.$text = { $search: req.query.keyword };
  }

  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }

  // Filter by brand
  if (req.query.brand) {
    query.brand = { $regex: req.query.brand, $options: 'i' };
  }

  // Filter by price range
  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) {
      query.price.$gte = parseFloat(req.query.minPrice);
    }
    if (req.query.maxPrice) {
      query.price.$lte = parseFloat(req.query.maxPrice);
    }
  }

  // Filter by rating
  if (req.query.rating) {
    query.rating = { $gte: parseFloat(req.query.rating) };
  }

  // Filter by featured
  if (req.query.featured === 'true') {
    query.featured = true;
  }

  // Filter by in stock
  if (req.query.inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  // Sort
  let sort = {};
  switch (req.query.sort) {
    case 'price-asc':
      sort = { price: 1 };
      break;
    case 'price-desc':
      sort = { price: -1 };
      break;
    case 'rating':
      sort = { rating: -1, numReviews: -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'popularity':
      sort = { numReviews: -1, rating: -1 };
      break;
    default:
      sort = { createdAt: -1 };
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .select('-createdBy');

  res.json({
    success: true,
    data: products,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate({
      path: 'reviews',
      populate: {
        path: 'user',
        select: 'name',
      },
    });

  if (product && product.isActive) {
    res.json({
      success: true,
      data: product,
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;

  const products = await Product.find({ featured: true, isActive: true })
    .sort({ rating: -1 })
    .limit(limit)
    .select('-createdBy');

  res.json({
    success: true,
    data: products,
  });
});

// @desc    Get product categories
// @route   GET /api/products/categories
// @access  Public
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category', { isActive: true });

  res.json({
    success: true,
    data: categories,
  });
});

// @desc    Get product brands
// @route   GET /api/products/brands
// @access  Public
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Product.distinct('brand', { isActive: true });

  res.json({
    success: true,
    data: brands,
  });
});

// @desc    Create a product (admin)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    price,
    category,
    brand,
    images,
    stock,
    featured,
  } = req.body;

  // Transform images array - handle both string URLs and objects
  let processedImages = [{ url: '/images/placeholder.jpg', alt: name }];
  if (images && Array.isArray(images) && images.length > 0) {
    processedImages = images.map((img) => {
      if (typeof img === 'string') {
        return { url: img, alt: name };
      }
      return img;
    });
  }

  const product = await Product.create({
    name,
    description,
    price,
    category,
    brand,
    images: processedImages,
    stock: Math.round(Number(stock)),
    featured: featured || false,
    createdBy: req.user._id,
  });

  // Notify all users about new product
  await notifyNewProduct(product);

  res.status(201).json({
    success: true,
    data: product,
  });
});

// @desc    Update a product (admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Store old values for notification checks
    const oldPrice = product.price;
    const oldStock = product.stock;

    // Update fields
    if (req.body.name) product.name = req.body.name;
    if (req.body.description) product.description = req.body.description;
    if (req.body.price !== undefined) product.price = req.body.price;
    if (req.body.category) product.category = req.body.category;
    if (req.body.brand) product.brand = req.body.brand;
    
    // Update stock - accept the exact value sent
    if (req.body.stock !== undefined) {
      product.stock = req.body.stock;
      console.log('Setting stock to:', req.body.stock);
    }
    
    // Transform images array - handle both string URLs and objects
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      product.images = req.body.images.map((img) => {
        if (typeof img === 'string') {
          return { url: img, alt: product.name };
        }
        return img;
      });
      console.log('Setting images count:', product.images.length);
    }
    
    if (req.body.featured !== undefined) product.featured = req.body.featured;
    if (req.body.isActive !== undefined) product.isActive = req.body.isActive;

    const updatedProduct = await product.save();
    console.log('Saved product - stock:', updatedProduct.stock, 'images:', updatedProduct.images.length);

    // Notify about price drop
    if (req.body.price !== undefined && req.body.price < oldPrice) {
      await notifyPriceDrop(updatedProduct, oldPrice, updatedProduct.price);
    }

    // Notify about back in stock
    if (oldStock === 0 && updatedProduct.stock > 0) {
      await notifyBackInStock(updatedProduct);
    }

    res.json({
      success: true,
      data: updatedProduct,
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Delete a product (admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await Product.deleteOne({ _id: product._id });

    res.json({
      success: true,
      message: 'Product removed',
    });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Get all products for admin (including inactive)
// @route   GET /api/products/admin/all
// @access  Private/Admin
export const getAdminProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = {};

  if (req.query.keyword) {
    query.$or = [
      { name: { $regex: req.query.keyword, $options: 'i' } },
      { brand: { $regex: req.query.keyword, $options: 'i' } },
    ];
  }

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true';
  }

  const count = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: products,
    page,
    pages: Math.ceil(count / limit),
    total: count,
  });
});

// @desc    Get related products (same category, different product)
// @route   GET /api/products/:id/related
// @access  Public
export const getRelatedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .sort({ rating: -1, numReviews: -1 })
    .limit(limit)
    .select('name price images rating numReviews stock');

  res.json({
    success: true,
    data: relatedProducts,
  });
});

// @desc    Get frequently bought together products
// @route   GET /api/products/:id/frequently-bought
// @access  Public
export const getFrequentlyBoughtTogether = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 4;
  const Order = (await import('../models/Order.js')).default;
  
  const productId = req.params.id;

  // Find orders containing this product
  const orders = await Order.find({
    'orderItems.product': productId,
    status: 'Delivered',
  }).select('orderItems');

  // Count how often each other product appears with this product
  const productCounts = {};
  
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.product.toString() !== productId) {
        productCounts[item.product.toString()] = (productCounts[item.product.toString()] || 0) + 1;
      }
    }
  }

  // Sort by frequency
  const sortedProductIds = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  // Fetch product details
  const products = await Product.find({
    _id: { $in: sortedProductIds },
    isActive: true,
    stock: { $gt: 0 },
  }).select('name price images rating numReviews stock');

  // Sort by the original frequency order
  const sortedProducts = sortedProductIds
    .map(id => products.find(p => p._id.toString() === id))
    .filter(Boolean);

  res.json({
    success: true,
    data: sortedProducts,
  });
});

// @desc    Get customers also viewed products
// @route   GET /api/products/:id/also-viewed
// @access  Public
export const getCustomersAlsoViewed = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 8;
  
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Get products from same category with similar price range (±50%)
  const minPrice = product.price * 0.5;
  const maxPrice = product.price * 1.5;

  const products = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { category: product.category },
      { brand: product.brand },
      { price: { $gte: minPrice, $lte: maxPrice } },
    ],
  })
    .sort({ rating: -1, numReviews: -1 })
    .limit(limit)
    .select('name price images rating numReviews stock');

  res.json({
    success: true,
    data: products,
  });
});

// @desc    Get best sellers
// @route   GET /api/products/best-sellers
// @access  Public
export const getBestSellers = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const Order = (await import('../models/Order.js')).default;

  // Aggregate to find most ordered products
  const bestSellers = await Order.aggregate([
    { $match: { status: 'Delivered' } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        totalSold: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: limit },
  ]);

  const productIds = bestSellers.map((item) => item._id);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  }).select('name price images rating numReviews stock isBestSeller');

  // Merge with sales data
  const result = products.map((product) => {
    const salesData = bestSellers.find((s) => s._id.toString() === product._id.toString());
    return {
      ...product.toObject(),
      totalSold: salesData?.totalSold || 0,
      revenue: salesData?.revenue || 0,
    };
  });

  // Sort by totalSold
  result.sort((a, b) => b.totalSold - a.totalSold);

  res.json({
    success: true,
    data: result,
  });
});

// @desc    Get new arrivals
// @route   GET /api/products/new-arrivals
// @access  Public
export const getNewArrivals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const days = parseInt(req.query.days) || 30;

  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const products = await Product.find({
    isActive: true,
    createdAt: { $gte: dateLimit },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('name price images rating numReviews stock createdAt');

  res.json({
    success: true,
    data: products,
  });
});

// @desc    Get deals and discounts (products with high ratings)
// @route   GET /api/products/deals
// @access  Public
export const getDeals = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;

  // Get top-rated products that are in stock
  const products = await Product.find({
    isActive: true,
    stock: { $gt: 0 },
    rating: { $gte: 4 },
    numReviews: { $gte: 5 },
  })
    .sort({ rating: -1, numReviews: -1 })
    .limit(limit)
    .select('name price images rating numReviews stock isTopRated');

  res.json({
    success: true,
    data: products,
  });
});

// @desc    Upload product images
// @route   POST /api/products/upload-images
// @access  Private/Admin
export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No images uploaded');
  }

  // Import uploadToCloudinary function
  const { uploadToCloudinary } = await import('../config/cloudinary.js');
  
  // Upload each file to Cloudinary
  const uploadPromises = req.files.map(async (file) => {
    // If using memory storage (Cloudinary enabled), upload buffer
    if (file.buffer) {
      const result = await uploadToCloudinary(file);
      return {
        url: result.url,
        alt: file.originalname,
        public_id: result.public_id,
      };
    }
    // If using disk storage (local), return local path
    return {
      url: file.path || `/uploads/${file.filename}`,
      alt: file.originalname,
      public_id: file.filename,
    };
  });

  const images = await Promise.all(uploadPromises);

  res.json({
    success: true,
    data: images,
    message: `${images.length} image(s) uploaded successfully`,
  });
});
