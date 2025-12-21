import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUserCart, clearUserCart } from './store/slices/cartSlice';
import { checkAuth } from './store/slices/authSlice';
import { tokenStorage } from './utils/api';

// Utils
import ScrollToTop from './components/utils/ScrollToTop';

// Layout
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Components
import LiveChatWidget from './components/ui/LiveChatWidget';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HelpPage from './pages/HelpPage';
import FlashSalePage from './pages/FlashSalePage';
import BundlesPage from './pages/BundlesPage';
import BundleDetailsPage from './pages/BundleDetailsPage';

// Protected Pages
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import TicketDetailPage from './pages/TicketDetailPage';
import AddressBookPage from './pages/AddressBookPage';
import NotificationsPage from './pages/NotificationsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import ReferralPage from './pages/ReferralPage';
import BuyAgainPage from './pages/BuyAgainPage';
import GiftCardsPage from './pages/GiftCardsPage';
import PremiumPage from './pages/PremiumPage';
import PriceAlertsPage from './pages/PriceAlertsPage';
import SavedCartsPage from './pages/SavedCartsPage';
import TestimonialPage from './pages/TestimonialPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSupport from './pages/admin/AdminSupport';
import AdminTicketDetail from './pages/admin/AdminTicketDetail';
import AdminFlashSales from './pages/admin/AdminFlashSales';
import AdminBundles from './pages/admin/AdminBundles';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminDeals from './pages/admin/AdminDeals';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminTestimonialPage from './pages/admin/AdminTestimonialPage';

// Route Guards
import PrivateRoute from './components/routes/PrivateRoute';
import AdminRoute from './components/routes/AdminRoute';
import GuestRoute from './components/routes/GuestRoute';

// 404
import NotFoundPage from './pages/NotFoundPage';

function App() {
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth) || {};
  const { user, isAuthenticated, isLoading } = authState;

  // Check auth on app load
  useEffect(() => {
    // Debug: Check localStorage availability on mobile
    console.log('=== APP INIT DEBUG ===');
    console.log('localStorage available:', typeof localStorage !== 'undefined');
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      console.log('localStorage working: true');
    } catch (e) {
      console.error('localStorage working: false -', e.message);
    }
    console.log('accessToken in storage:', !!tokenStorage.getAccessToken());
    console.log('refreshToken in storage:', !!tokenStorage.getRefreshToken());
    console.log('Dispatching checkAuth...');
    
    dispatch(checkAuth());
  }, [dispatch]);

  // Load/clear cart based on authentication state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user?._id) {
        // Load user-specific cart when logged in
        dispatch(loadUserCart(user._id));
      } else {
        // Clear cart when not authenticated
        dispatch(clearUserCart());
      }
    }
  }, [dispatch, isAuthenticated, user?._id, isLoading]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailsPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="compare" element={<ComparePage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="flash-sale/:id" element={<FlashSalePage />} />
        <Route path="bundles" element={<BundlesPage />} />
        <Route path="bundles/:id" element={<BundleDetailsPage />} />
        <Route path="gift-cards" element={<GiftCardsPage />} />
        <Route path="premium" element={<PremiumPage />} />
        
        {/* Guest Only Routes */}
        <Route element={<GuestRoute />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="order-success/:id" element={<OrderSuccessPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailsPage />} />
          <Route path="orders/:id/tracking" element={<OrderTrackingPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="addresses" element={<AddressBookPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="loyalty" element={<LoyaltyPage />} />
          <Route path="referrals" element={<ReferralPage />} />
          <Route path="buy-again" element={<BuyAgainPage />} />
          <Route path="price-alerts" element={<PriceAlertsPage />} />
          <Route path="saved-carts" element={<SavedCartsPage />} />
          <Route path="testimonials" element={<TestimonialPage />} />
          <Route path="help/ticket/:id" element={<TicketDetailPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="flash-sales" element={<AdminFlashSales />} />
          <Route path="bundles" element={<AdminBundles />} />
          <Route path="deals" element={<AdminDeals />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="support/:id" element={<AdminTicketDetail />} />
          <Route path="testimonials" element={<AdminTestimonialPage />} />
        </Route>
      </Route>
    </Routes>
    {/* Live Chat Widget - Available on all pages */}
    {isAuthenticated && <LiveChatWidget />}
    </>
  );
}

export default App;
