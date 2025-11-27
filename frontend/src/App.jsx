import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadUserCart, clearUserCart } from './store/slices/cartSlice';
import { checkAuth } from './store/slices/authSlice';

// Utils
import ScrollToTop from './components/utils/ScrollToTop';

// Layout
import Layout from './components/layout/Layout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HelpPage from './pages/HelpPage';

// Protected Pages
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import TicketDetailPage from './pages/TicketDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSupport from './pages/admin/AdminSupport';

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
          <Route path="wishlist" element={<WishlistPage />} />
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
          <Route path="support" element={<AdminSupport />} />
        </Route>
      </Route>
    </Routes>
    </>
  );
}

export default App;
