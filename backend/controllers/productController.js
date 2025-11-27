import asyncHandler from 'express-async-handler';
import Product from '../models/Product.js';

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
    stock,
    featured: featured || false,
    createdBy: req.user._id,
  });

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
    product.name = req.body.name || product.name;
    product.description = req.body.description || product.description;
    product.price = req.body.price ?? product.price;
    product.category = req.body.category || product.category;
    product.brand = req.body.brand || product.brand;
    
    // Transform images array - handle both string URLs and objects
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
      product.images = req.body.images.map((img) => {
        if (typeof img === 'string') {
          return { url: img, alt: product.name };
        }
        return img;
      });
    }
    
    product.stock = req.body.stock ?? product.stock;
    product.featured = req.body.featured ?? product.featured;
    product.isActive = req.body.isActive ?? product.isActive;

    const updatedProduct = await product.save();

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

// @desc    Upload product images
// @route   POST /api/products/upload-images
// @access  Private/Admin
export const uploadProductImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No images uploaded');
  }

  // Get uploaded image URLs
  const images = req.files.map((file) => ({
    url: file.path || file.location || `/uploads/${file.filename}`,
    alt: file.originalname,
    public_id: file.filename,
  }));

  res.json({
    success: true,
    data: images,
    message: `${images.length} image(s) uploaded successfully`,
  });
});
