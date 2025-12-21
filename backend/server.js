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
import testimonialRoutes from './routes/testimonialRoutes.js';

dotenv.config();

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
connectDB();

const app = express();

// Trust proxy for production (Railway, Vercel, etc.)
app.set('trust proxy', 1);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://shop-hub-dusky.vercel.app',
  'https://shophub-ankitraj6767s-projects.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// CRITICAL: Handle OPTIONS preflight requests FIRST, before any other middleware
// This is essential for mobile browsers which are stricter about CORS
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log('📱 OPTIONS preflight request from:', origin, '| User-Agent:', req.headers['user-agent']?.substring(0, 50));
  
  // Set CORS headers for preflight
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
  
  res.status(204).end();
});

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Log all CORS requests for debugging
    console.log('🌐 CORS request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all Vercel preview deployments
    if (origin.includes('vercel.app') || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Check against allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In production, be more permissive to handle various deployments
    if (process.env.NODE_ENV === 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
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
app.use('/api/testimonials', testimonialRoutes);

// Health check - detailed for debugging mobile issues
app.get('/api/health', (req, res) => {
  const clientInfo = {
    ip: req.ip || req.connection.remoteAddress,
    forwardedFor: req.headers['x-forwarded-for'],
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
  };
  console.log('🏥 Health check from:', clientInfo);
  res.json({ 
    success: true, 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    client: clientInfo
  });
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
