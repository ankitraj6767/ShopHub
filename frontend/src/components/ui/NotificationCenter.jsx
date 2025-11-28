import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiBell,
  FiX,
  FiPackage,
  FiTag,
  FiTruck,
  FiCheck,
  FiAlertCircle,
  FiTrash2,
  FiGift,
  FiStar,
} from 'react-icons/fi';
import api from '../../utils/api';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useSelector((state) => state.auth) || {};
  const lastFetchRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    // Debounce: don't fetch if less than 5 seconds since last fetch
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    if (!isAuthenticated) {
      // For non-authenticated users, just load from localStorage
      loadFromLocalStorage();
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get('/notifications?limit=20');
      
      if (response.data.success && response.data.data) {
        const apiNotifications = response.data.data;
        setNotifications(apiNotifications);
        setUnreadCount(response.data.unreadCount || apiNotifications.filter(n => !n.read).length);
        
        // Sync to localStorage for persistence
        localStorage.setItem('notifications', JSON.stringify(apiNotifications));
        localStorage.setItem('notificationsUnreadCount', String(response.data.unreadCount || 0));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to localStorage on error
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadFromLocalStorage = () => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => n.read !== true && n.read !== 'true').length);
      } catch (e) {
        console.error('Error parsing localStorage notifications:', e);
      }
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(fetchNotifications, 30000);

    // Listen for storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === 'notifications') {
        loadFromLocalStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom notification refresh event
    const handleNotificationRefresh = () => {
      lastFetchRef.current = 0; // Reset debounce
      fetchNotifications();
    };
    window.addEventListener('notificationRefresh', handleNotificationRefresh);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notificationRefresh', handleNotificationRefresh);
    };
  }, [fetchNotifications]);

  // Refetch when authentication changes
  useEffect(() => {
    lastFetchRef.current = 0; // Reset debounce on auth change
    fetchNotifications();
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = async (id) => {
    const updated = notifications.map(n =>
      (n.id === id || n._id === id) ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(prev => Math.max(0, prev - 1));
    localStorage.setItem('notifications', JSON.stringify(updated));

    if (isAuthenticated) {
      try {
        await api.put(`/notifications/${id}/read`);
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem('notifications', JSON.stringify(updated));

    if (isAuthenticated) {
      try {
        await api.put('/notifications/read-all');
      } catch (error) {
        console.error('Failed to mark all as read:', error);
      }
    }
  };

  const deleteNotification = async (id) => {
    const updated = notifications.filter(n => n.id !== id && n._id !== id);
    const deletedNotif = notifications.find(n => n.id === id || n._id === id);
    
    setNotifications(updated);
    if (deletedNotif && !deletedNotif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    localStorage.setItem('notifications', JSON.stringify(updated));

    if (isAuthenticated) {
      try {
        await api.delete(`/notifications/${id}`);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    }
  };

  const clearAll = async () => {
    // Delete all from backend
    if (isAuthenticated) {
      try {
        for (const notif of notifications) {
          await api.delete(`/notifications/${notif._id || notif.id}`);
        }
      } catch (error) {
        console.error('Failed to clear all notifications:', error);
      }
    }
    
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
      case 'order_update':
        return <FiPackage className="text-blue-500" />;
      case 'deal':
      case 'promo':
      case 'promotion':
        return <FiTag className="text-red-500" />;
      case 'shipping':
      case 'delivery':
        return <FiTruck className="text-green-500" />;
      case 'stock':
      case 'back_in_stock':
        return <FiAlertCircle className="text-yellow-500" />;
      case 'price_drop':
        return <FiGift className="text-purple-500" />;
      case 'system':
        return <FiStar className="text-orange-500" />;
      case 'success':
        return <FiCheck className="text-green-500" />;
      default:
        return <FiBell className="text-gray-500" />;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) {
      return 'Just now';
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}m ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            lastFetchRef.current = 0;
            fetchNotifications();
          }
        }}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
      >
        <FiBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications
                {isLoading && <span className="ml-2 text-xs text-gray-400">(loading...)</span>}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <FiBell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    You'll receive notifications for orders, deals, and more
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => {
                  const notifId = notification._id || notification.id;
                  const isRead = notification.read === true || notification.read === 'true';
                  return (
                    <div
                      key={notifId}
                      className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                        !isRead ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={notification.link || '#'}
                            onClick={() => {
                              markAsRead(notifId);
                              setIsOpen(false);
                            }}
                            className="block"
                          >
                            <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                              {notification.title}
                              {!isRead && (
                                <span className="ml-2 inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
                              )}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.time || notification.createdAt)}
                            </p>
                          </Link>
                        </div>
                        <button
                          onClick={() => deleteNotification(notifId)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t dark:border-gray-700 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View all notifications ({notifications.length})
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
