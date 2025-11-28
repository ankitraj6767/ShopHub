import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiPackage, FiTag, FiAlertCircle, FiCheckCircle, FiTrash2, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useSelector } from 'react-redux';
import api from '../utils/api';
import { formatDateTime } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

const NotificationsPage = () => {
  const { isAuthenticated } = useSelector((state) => state.auth) || {};
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Try to fetch from API first
        try {
          const response = await api.get('/notifications?limit=100');
          if (response.data.success && response.data.data && response.data.data.length > 0) {
            setNotifications(response.data.data);
            setIsLoading(false);
            return;
          }
        } catch (apiError) {
          console.log('API fetch failed, falling back to localStorage:', apiError);
        }
      }
      
      // Fallback to localStorage (for both guests and when API returns empty)
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } else {
        // Create demo notifications if none exist
        const demoNotifications = [
          {
            id: 1,
            type: 'order',
            title: 'Order Shipped',
            message: 'Your order #ORD123 has been shipped and is on its way!',
            time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            read: false,
            link: '/orders',
          },
          {
            id: 2,
            type: 'promo',
            title: 'Flash Sale!',
            message: 'Up to 50% off on Electronics. Limited time only!',
            time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            read: false,
            link: '/products?category=Electronics',
          },
          {
            id: 3,
            type: 'back_in_stock',
            title: 'Back in Stock',
            message: 'iPhone 15 Pro Max is back in stock!',
            time: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            read: true,
            link: '/products',
          },
        ];
        setNotifications(demoNotifications);
        localStorage.setItem('notifications', JSON.stringify(demoNotifications));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      if (isAuthenticated) {
        try {
          await api.put(`/notifications/${id}/read`);
        } catch (e) {
          console.log('API mark as read failed:', e);
        }
      }
      const updated = notifications.map(n =>
        (n._id === id || n.id === id) ? { ...n, read: true } : n
      );
      setNotifications(updated);
      // Always sync with localStorage
      localStorage.setItem('notifications', JSON.stringify(updated));
      toast.success('Marked as read');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      if (isAuthenticated) {
        try {
          await api.put('/notifications/read-all');
        } catch (e) {
          console.log('API mark all as read failed:', e);
        }
      }
      const updated = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updated);
      // Always sync with localStorage
      localStorage.setItem('notifications', JSON.stringify(updated));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      if (isAuthenticated) {
        try {
          await api.delete(`/notifications/${id}`);
        } catch (e) {
          console.log('API delete failed:', e);
        }
      }
      const updated = notifications.filter(n => n._id !== id && n.id !== id);
      setNotifications(updated);
      // Always sync with localStorage
      localStorage.setItem('notifications', JSON.stringify(updated));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
      case 'order_update':
        return <FiPackage className="w-5 h-5 text-blue-500" />;
      case 'promo':
      case 'promotion':
        return <FiTag className="w-5 h-5 text-green-500" />;
      case 'alert':
      case 'return_request':
        return <FiAlertCircle className="w-5 h-5 text-orange-500" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    // Handle both boolean and string/undefined cases
    const isRead = n.read === true || n.read === 'true';
    if (filter === 'unread') return !isRead;
    if (filter === 'read') return isRead;
    return true;
  });

  // Calculate counts from local data
  const unreadCount = notifications.filter(n => !(n.read === true || n.read === 'true')).length;
  const readCount = notifications.filter(n => n.read === true || n.read === 'true').length;
  const totalCount = notifications.length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        {unreadCount > 0 && (
          <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'unread'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'read'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Read ({readCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <FiCheck className="w-4 h-4" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
          <FiBell className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No notifications</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {filter === 'unread' 
              ? "You're all caught up!" 
              : filter === 'read' 
                ? "No read notifications yet"
                : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm divide-y dark:divide-gray-700">
          {filteredNotifications.map((notification) => {
            const isRead = notification.read === true || notification.read === 'true';
            return (
              <div
                key={notification._id || notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                  !isRead ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="relative">
                      {getIcon(notification.type)}
                      {!isRead && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                          {!isRead && (
                            <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full">
                              New
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {formatDateTime(notification.createdAt || notification.time)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isRead && (
                          <button
                            onClick={() => markAsRead(notification._id || notification.id)}
                            className="p-2 text-gray-400 hover:text-primary-600 transition"
                            title="Mark as read"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification._id || notification.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {notification.link && (
                      <Link
                        to={notification.link}
                        className="inline-block text-sm text-primary-600 hover:text-primary-700 mt-2"
                      >
                        View details →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
