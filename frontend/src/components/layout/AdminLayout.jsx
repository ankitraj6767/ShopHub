import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { 
  FiHome, FiPackage, FiShoppingBag, FiUsers, FiLogOut, FiArrowLeft, 
  FiMessageCircle, FiTag, FiZap, FiLayers, FiBarChart2, FiMenu, FiX,
  FiChevronRight, FiShield, FiDollarSign, FiPercent, FiMessageSquare
} from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';

const AdminLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // On mobile, always show collapsed (icons only)
  const isCollapsed = isMobile || sidebarCollapsed;

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/');
  };

  const navItems = [
    { path: '/admin', icon: FiHome, label: 'Dashboard', exact: true, color: 'from-blue-500 to-blue-600' },
    { path: '/admin/products', icon: FiPackage, label: 'Products', color: 'from-emerald-500 to-emerald-600' },
    { path: '/admin/orders', icon: FiShoppingBag, label: 'Orders', color: 'from-orange-500 to-orange-600' },
    { path: '/admin/users', icon: FiUsers, label: 'Users', color: 'from-purple-500 to-purple-600' },
    { path: '/admin/coupons', icon: FiTag, label: 'Coupons', color: 'from-pink-500 to-pink-600' },
    { path: '/admin/flash-sales', icon: FiZap, label: 'Flash Sales', color: 'from-yellow-500 to-yellow-600' },
    { path: '/admin/deals', icon: FiPercent, label: 'Deals', color: 'from-red-500 to-red-600' },
    { path: '/admin/bundles', icon: FiLayers, label: 'Bundles', color: 'from-indigo-500 to-indigo-600' },
    { path: '/admin/testimonials', icon: FiMessageSquare, label: 'Testimonials', color: 'from-teal-500 to-teal-600' },
    { path: '/admin/revenue', icon: FiDollarSign, label: 'Revenue', color: 'from-green-500 to-green-600' },
    { path: '/admin/analytics', icon: FiBarChart2, label: 'Analytics', color: 'from-cyan-500 to-cyan-600' },
    { path: '/admin/support', icon: FiMessageCircle, label: 'Support', color: 'from-rose-500 to-rose-600' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-16 lg:w-20' : 'w-72'} bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col transition-all duration-300 shadow-2xl z-50`}>
        {/* Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 lg:h-20 px-3 lg:px-4 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur flex-shrink-0`}>
          {!isCollapsed && (
            <Link to="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">ShopHub</span>
                <span className="block text-xs text-gray-400">Admin Panel</span>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/admin" className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
              <FiShield className="w-5 h-5 text-white" />
            </Link>
          )}
          {/* Only show toggle button on desktop */}
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors hidden lg:block"
            >
              {isCollapsed ? <FiMenu className="w-5 h-5" /> : <FiX className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 lg:py-6 px-2 lg:px-3 space-y-1 lg:space-y-2 admin-sidebar-nav">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center ${isCollapsed ? 'justify-center px-2 lg:px-3' : 'px-4'} py-2.5 lg:py-3 rounded-xl transition-all duration-200 relative overflow-hidden ${
                  active
                    ? `bg-gradient-to-r ${item.color} shadow-lg`
                    : 'hover:bg-gray-700/50'
                }`}
                title={item.label}
              >
                <div className={`flex items-center justify-center ${isCollapsed ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg ${active ? 'bg-white/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'} transition-colors`}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                </div>
                {!isCollapsed && (
                  <>
                    <span className={`ml-3 font-medium ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {active && (
                      <FiChevronRight className="w-4 h-4 ml-auto text-white/70" />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Fixed Bottom Section */}
        <div className="flex-shrink-0 border-t border-gray-700/50 p-2 lg:p-4 bg-gray-900/50 backdrop-blur">
          {/* User Profile */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} mb-2 lg:mb-4 p-2 lg:p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700/50`}>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-2 ring-primary-500/30">
              <span className="text-white font-bold text-sm lg:text-base">{user?.name?.charAt(0).toUpperCase()}</span>
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="font-medium text-white truncate text-sm lg:text-base">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.role || 'Administrator'}</p>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className={`space-y-1 lg:space-y-2 ${isCollapsed ? 'px-0' : ''}`}>
            <Link
              to="/"
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-all group`}
              title="Back to Store"
            >
              <FiArrowLeft className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
              {!isCollapsed && <span className="ml-3 text-sm font-medium">Back to Store</span>}
            </Link>
            <button
              onClick={handleLogout}
              className={`flex items-center ${isCollapsed ? 'justify-center' : ''} w-full px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all`}
              title="Logout"
            >
              <FiLogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="ml-3 text-sm font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${isCollapsed ? 'ml-16 lg:ml-20' : 'ml-72'} transition-all duration-300`}>
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm h-14 lg:h-20 flex items-center px-4 lg:px-8 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h1 className="text-lg lg:text-2xl font-bold text-gray-800 dark:text-white">
              {navItems.find((item) => isActive(item.path, item.exact))?.label || 'Admin'}
            </h1>
            <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Manage your store efficiently</p>
          </div>
        </header>
        <main className="p-3 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
