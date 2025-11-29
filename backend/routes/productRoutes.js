import express from 'express';
import {
  getProducts,
  getProductById,
  getFeaturedProducts,
  getCategories,
  getBrands,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminProducts,
  uploadProductImages,
  getRelatedProducts,
  getFrequentlyBoughtTogether,
  getCustomersAlsoViewed,
  getBestSellers,
  getNewArrivals,
  getDeals,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { productValidation, mongoIdValidation } from '../middleware/validationMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

// Public routes (specific routes before parameterized routes)
router.get('/featured', getFeaturedProducts);
router.get('/categories', getCategories);
router.get('/brands', getBrands);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/deals', getDeals);

// Admin routes (must be before :id route)
router.get('/admin/all', protect, admin, getAdminProducts);

// Public routes with parameters
router.get('/', getProducts);
router.get('/:id', mongoIdValidation, getProductById);
router.get('/:id/related', mongoIdValidation, getRelatedProducts);
router.get('/:id/frequently-bought', mongoIdValidation, getFrequentlyBoughtTogether);
router.get('/:id/also-viewed', mongoIdValidation, getCustomersAlsoViewed);

// Admin CRUD routes
router.post('/', protect, admin, productValidation, createProduct);
router.put('/:id', protect, admin, mongoIdValidation, updateProduct);
router.delete('/:id', protect, admin, mongoIdValidation, deleteProduct);

// Image upload route
router.post('/upload-images', protect, admin, upload.array('images', 5), uploadProductImages);

export default router;
