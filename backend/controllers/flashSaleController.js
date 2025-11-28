import asyncHandler from 'express-async-handler';
import FlashSale from '../models/FlashSale.js';
import Product from '../models/Product.js';

// @desc    Get all flash sales (optionally filter by active/all)
// @route   GET /api/flash-sales
// @access  Public
export const getFlashSales = asyncHandler(async (req, res) => {
  const { all } = req.query;
  const now = new Date();
  
  // If 'all' query param is set, return all flash sales (for admin)
  const query = all === 'true' 
    ? {} 
    : {
        isActive: true,
        endTime: { $gte: now },
      };
  
  const flashSales = await FlashSale.find(query)
    .populate('products.product', 'name images rating numReviews price')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: flashSales,
  });
});

// @desc    Get current live flash sale
// @route   GET /api/flash-sales/live
// @access  Public
export const getLiveFlashSale = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const flashSale = await FlashSale.findOne({
    isActive: true,
    startTime: { $lte: now },
    endTime: { $gte: now },
  })
    .populate('products.product', 'name images rating numReviews stock')
    .sort({ startTime: -1 });

  if (!flashSale) {
    // Get upcoming sale
    const upcomingSale = await FlashSale.findOne({
      isActive: true,
      startTime: { $gt: now },
    })
      .populate('products.product', 'name images rating numReviews')
      .sort({ startTime: 1 });

    return res.json({
      success: true,
      data: null,
      upcoming: upcomingSale,
    });
  }

  res.json({
    success: true,
    data: flashSale,
  });
});

// @desc    Get flash sale by ID
// @route   GET /api/flash-sales/:id
// @access  Public
export const getFlashSaleById = asyncHandler(async (req, res) => {
  const flashSale = await FlashSale.findById(req.params.id)
    .populate('products.product', 'name description images rating numReviews stock');

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale not found');
  }

  res.json({
    success: true,
    data: flashSale,
  });
});

// @desc    Create flash sale
// @route   POST /api/flash-sales
// @access  Private/Admin
export const createFlashSale = asyncHandler(async (req, res) => {
  const { name, description, products, startTime, endTime, banner } = req.body;

  if (!products || products.length === 0) {
    res.status(400);
    throw new Error('Please add at least one product');
  }

  // Validate products and get original prices
  const productData = [];
  for (const item of products) {
    // Support both 'product' and 'productId' field names
    const productId = item.product || item.productId;
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product ${productId} not found`);
    }
    productData.push({
      product: productId,
      salePrice: item.salePrice,
      originalPrice: product.price,
      quantity: item.quantityLimit || item.quantity || 50,
    });
  }

  const flashSale = await FlashSale.create({
    name,
    description,
    products: productData,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    banner,
  });

  res.status(201).json({
    success: true,
    data: flashSale,
  });
});

// @desc    Update flash sale
// @route   PUT /api/flash-sales/:id
// @access  Private/Admin
export const updateFlashSale = asyncHandler(async (req, res) => {
  let flashSale = await FlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale not found');
  }

  const { name, description, products, startTime, endTime, banner, isActive } = req.body;

  // If products are being updated, process them
  let productData = flashSale.products;
  if (products && products.length > 0) {
    productData = [];
    for (const item of products) {
      const productId = item.product || item.productId;
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404);
        throw new Error(`Product ${productId} not found`);
      }
      productData.push({
        product: productId,
        salePrice: item.salePrice,
        originalPrice: product.price,
        quantity: item.quantityLimit || item.quantity || 50,
        sold: item.sold || 0,
      });
    }
  }

  flashSale = await FlashSale.findByIdAndUpdate(
    req.params.id,
    {
      name: name || flashSale.name,
      description: description !== undefined ? description : flashSale.description,
      products: productData,
      startTime: startTime ? new Date(startTime) : flashSale.startTime,
      endTime: endTime ? new Date(endTime) : flashSale.endTime,
      banner: banner !== undefined ? banner : flashSale.banner,
      isActive: isActive !== undefined ? isActive : flashSale.isActive,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate('products.product', 'name images price');

  res.json({
    success: true,
    data: flashSale,
  });
});

// @desc    Delete flash sale
// @route   DELETE /api/flash-sales/:id
// @access  Private/Admin
export const deleteFlashSale = asyncHandler(async (req, res) => {
  const flashSale = await FlashSale.findById(req.params.id);

  if (!flashSale) {
    res.status(404);
    throw new Error('Flash sale not found');
  }

  await flashSale.deleteOne();

  res.json({
    success: true,
    message: 'Flash sale deleted',
  });
});

// @desc    Purchase flash sale item
// @route   POST /api/flash-sales/:id/purchase
// @access  Private
export const purchaseFlashSaleItem = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  
  const flashSale = await FlashSale.findById(req.params.id);
  
  if (!flashSale || !flashSale.isLive) {
    res.status(400);
    throw new Error('Flash sale is not available');
  }

  const saleProduct = flashSale.products.find(
    (p) => p.product.toString() === productId
  );

  if (!saleProduct) {
    res.status(404);
    throw new Error('Product not found in this flash sale');
  }

  const remainingQuantity = saleProduct.quantity - saleProduct.sold;
  if (remainingQuantity < quantity) {
    res.status(400);
    throw new Error(`Only ${remainingQuantity} items left`);
  }

  // Update sold count
  saleProduct.sold += quantity;
  await flashSale.save();

  res.json({
    success: true,
    data: {
      product: saleProduct,
      salePrice: saleProduct.salePrice,
      originalPrice: saleProduct.originalPrice,
    },
  });
});
