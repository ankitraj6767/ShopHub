import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { login, clearError } from '../store/slices/authSlice';
import api from '../utils/api';

// login
const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state) => state.auth);
  const [connectionStatus, setConnectionStatus] = useState('checking');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname || '/';

  // Test API connectivity on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔗 Testing API connectivity...');
        const response = await api.get('/health');
        console.log('✅ API connection successful:', response.data);
        setConnectionStatus('connected');
      } catch (err) {
        console.error('❌ API connection failed:', {
          message: err.message,
          status: err.response?.status,
          isNetworkError: !err.response
        });
        setConnectionStatus('failed');
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('User Agent:', navigator.userAgent);
    console.log('Cookies enabled:', navigator.cookieEnabled);
    console.log('localStorage available:', typeof localStorage !== 'undefined');
    
    try {
      const result = await dispatch(login(formData));
      
      console.log('Login result:', result.type, result.payload ? 'has payload' : 'no payload');
      
      if (login.fulfilled.match(result)) {
        console.log('Login fulfilled, navigating to:', from);
        toast.success('Welcome back!');
        navigate(from, { replace: true });
      } else if (login.rejected.match(result)) {
        console.error('Login rejected:', result.payload || result.error);
      }
    } catch (err) {
      console.error('Login exception:', err);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account to continue</p>
          {/* Connection status indicator for debugging */}
          {connectionStatus === 'failed' && (
            <p className="text-red-500 text-sm mt-2">⚠️ Cannot connect to server. Please check your internet connection.</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
