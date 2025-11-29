import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import config from './config/config.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimitMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import stockAlertRoutes from './routes/stockAlertRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import flashSaleRoutes from './routes/flashSaleRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import giftCardRoutes from './routes/giftCardRoutes.js';
import bundleRoutes from './routes/bundleRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import premiumRoutes from './routes/premiumRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

const app = express();

// Trust proxy for production (Railway, Vercel, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: true, // Allow all origins in production (credentials still required)
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/stock-alerts', stockAlertRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/gift-cards', giftCardRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/activity', activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'ShopHub API Server',
    version: '1.0.0',
    endpoints: '/api/*'
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});
