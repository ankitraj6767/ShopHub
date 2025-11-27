import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  checkStockAlert,
  subscribeStockAlert,
  unsubscribeStockAlert,
} from '../../store/slices/stockAlertSlice';

const StockAlertButton = ({ productId, inStock }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const stockAlertState = useSelector((state) => state.stockAlert) || {};
  const { alertStatus = {} } = stockAlertState;

  const [showOptions, setShowOptions] = useState(false);
  const [emailAlert, setEmailAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(false);

  const status = alertStatus[productId] || { subscribed: false, loading: false };

  useEffect(() => {
    if (user && productId && !inStock) {
      dispatch(checkStockAlert(productId));
    }
  }, [dispatch, user, productId, inStock]);

  const handleSubscribe = () => {
    dispatch(
      subscribeStockAlert({
        productId,
        preferences: { emailNotification: emailAlert, pushNotification: pushAlert },
      })
    );
    setShowOptions(false);
  };

  const handleUnsubscribe = () => {
    dispatch(unsubscribeStockAlert(productId));
  };

  // Don't show if product is in stock
  if (inStock) {
    return null;
  }

  // Don't show if user is not logged in
  if (!user) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <span className="text-sm">
            <a href="/login" className="text-yellow-600 hover:underline">
              Sign in
            </a>{' '}
            to get notified when this item is back in stock
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {status.subscribed ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">
                You'll be notified when this item is back in stock
              </span>
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={status.loading}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {status.loading ? 'Removing...' : 'Remove alert'}
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg">
          {showOptions ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Notification Preferences</h4>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlert}
                  onChange={(e) => setEmailAlert(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-600">Email notification</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushAlert}
                  onChange={(e) => setPushAlert(e.target.checked)}
                  className="w-4 h-4 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm text-gray-600">Push notification</span>
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubscribe}
                  disabled={status.loading || (!emailAlert && !pushAlert)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 text-sm"
                >
                  {status.loading ? 'Subscribing...' : 'Notify Me'}
                </button>
                <button
                  onClick={() => setShowOptions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowOptions(true)}
              disabled={status.loading}
              className="flex items-center gap-2 w-full justify-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Notify Me When Available</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StockAlertButton;
