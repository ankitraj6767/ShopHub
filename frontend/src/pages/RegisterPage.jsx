import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiEye, FiEyeOff, FiGift, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { register, clearError } from '../store/slices/authSlice';
import api from '../utils/api';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [referralInfo, setReferralInfo] = useState(null);
  const [validatingReferral, setValidatingReferral] = useState(false);

  // Get referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode }));
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  // Validate referral code
  const validateReferralCode = async (code) => {
    if (!code || code.length < 6) {
      setReferralInfo(null);
      return;
    }
    
    setValidatingReferral(true);
    try {
      const { data } = await api.get(`/referrals/validate/${code}`);
      setReferralInfo(data.data);
    } catch (err) {
      setReferralInfo(null);
      if (code.length >= 6) {
        setErrors(prev => ({ ...prev, referralCode: 'Invalid referral code' }));
      }
    } finally {
      setValidatingReferral(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    
    // Validate referral code on change
    if (name === 'referralCode') {
      validateReferralCode(value);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const result = await dispatch(register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    }));

    if (register.fulfilled.match(result)) {
      // Apply referral code if valid
      if (referralInfo && formData.referralCode) {
        // Retry logic for referral application
        let applied = false;
        for (let attempt = 0; attempt < 3 && !applied; attempt++) {
          try {
            // Wait a bit longer on each retry to ensure token is ready
            await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
            const { data } = await api.post('/referrals/apply', { code: formData.referralCode });
            toast.success(`🎉 Welcome! ${data.message}`, { duration: 5000 });
            applied = true;
          } catch (err) {
            console.error(`Referral apply attempt ${attempt + 1} failed:`, err);
            if (attempt === 2) {
              // Final attempt failed
              toast.success('Account created successfully!');
            }
          }
        }
      } else {
        toast.success('Account created successfully!');
      }
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start shopping today</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`input ${errors.name ? 'input-error' : ''}`}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Referral Code Field */}
            <div>
              <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="referralCode"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  className={`input pr-10 ${errors.referralCode ? 'input-error' : ''} ${referralInfo ? 'border-green-500' : ''}`}
                  placeholder="REF-XXXXXX"
                />
                {validatingReferral && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}
                {referralInfo && !validatingReferral && (
                  <FiCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />
                )}
              </div>
              {errors.referralCode && (
                <p className="text-red-500 text-sm mt-1">{errors.referralCode}</p>
              )}
              {referralInfo && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <FiGift className="w-5 h-5" />
                    <span className="font-medium">Referred by {referralInfo.referrerName}</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    You'll get <strong>{referralInfo.reward} bonus points</strong> when you sign up!
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
