import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHome, FiPackage, FiShoppingBag, FiUsers, FiSettings, FiLogOut, FiArrowLeft, FiMessageCircle } from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';

const AdminLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true },
    { path: '/admin/products', icon: FiPackage, label: 'Products' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders' },
    { path: '/admin/users', icon: FiUsers, label: 'Users' },
    { path: '/admin/support', icon: FiMessageCircle, label: 'Support' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-800 text-white">
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <Link to="/admin" className="text-xl font-bold">
            ShopHub Admin
          </Link>
        </div>

        <nav className="mt-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                isActive(item.path, item.exact)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/"
              className="flex items-center text-gray-300 hover:text-white mb-2"
            >
              <FiArrowLeft className="w-5 h-5 mr-3" />
              Back to Store
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-300 hover:text-white w-full"
            >
              <FiLogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        <header className="bg-white shadow-sm h-16 flex items-center px-8">
          <h1 className="text-xl font-semibold text-gray-800">
            {navItems.find((item) => isActive(item.path, item.exact))?.label || 'Admin'}
          </h1>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
