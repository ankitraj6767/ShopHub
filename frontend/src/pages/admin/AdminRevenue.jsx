import { useState, useEffect } from 'react';
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiShoppingBag,
  FiStar,
  FiGift,
  FiRefreshCw,
  FiCalendar,
  FiDownload
} from 'react-icons/fi';
import { FaCrown } from 'react-icons/fa';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/helpers';

const AdminRevenue = () => {
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchRevenueData();
  }, [dateRange, startDate, endDate]);

  const fetchRevenueData = async () => {
    setLoading(true);
    try {
      let params = {};
      
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      } else {
        params.days = dateRange;
      }
      
      const [analyticsRes, statsRes] = await Promise.all([
        api.get('/analytics/revenue-analytics', { params }),
        api.get('/analytics/revenue-stats', { params })
      ]);
      
      // Map the data properly
      const analyticsData = analyticsRes.data.data;
      const mappedAnalytics = {
        totalRevenue: analyticsData?.summary?.total || 0,
        orderRevenue: analyticsData?.summary?.orders?.total || 0,
        subscriptionRevenue: analyticsData?.summary?.subscriptions?.total || 0,
        giftCardRevenue: analyticsData?.summary?.giftCards?.total || 0,
        totalTransactions: (analyticsData?.summary?.orders?.count || 0) + 
                          (analyticsData?.summary?.subscriptions?.count || 0) + 
                          (analyticsData?.summary?.giftCards?.count || 0),
        totalRefunds: (analyticsData?.summary?.orders?.refunded || 0) + 
                     (analyticsData?.summary?.subscriptions?.refunded || 0),
        averageOrderValue: analyticsData?.summary?.orders?.count > 0 
          ? Math.round(analyticsData?.summary?.orders?.total / analyticsData?.summary?.orders?.count) 
          : 0,
        breakdown: [
          { _id: 'order', total: analyticsData?.summary?.orders?.total || 0, count: analyticsData?.summary?.orders?.count || 0 },
          { _id: 'subscription', total: analyticsData?.summary?.subscriptions?.total || 0, count: analyticsData?.summary?.subscriptions?.count || 0 },
          { _id: 'gift_card', total: analyticsData?.summary?.giftCards?.total || 0, count: analyticsData?.summary?.giftCards?.count || 0 },
        ].filter(item => item.count > 0)
      };
      
      setAnalytics(mappedAnalytics);
      setStats(statsRes.data.data || []);
    } catch (error) {
      console.error('Failed to fetch revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!stats.length) return;
    
    const csvContent = [
      ['Date', 'Total Revenue', 'Order Revenue', 'Subscription Revenue', 'Transactions'],
      ...stats.map(item => [
        item._id,
        item.totalRevenue,
        item.orderRevenue,
        item.subscriptionRevenue,
        item.count
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Report downloaded');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const revenueCards = [
    {
      title: 'Total Revenue',
      value: analytics?.totalRevenue || 0,
      icon: FiDollarSign,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Order Revenue',
      value: analytics?.orderRevenue || 0,
      icon: FiShoppingBag,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Subscription Revenue',
      value: analytics?.subscriptionRevenue || 0,
      icon: FaCrown,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    {
      title: 'Gift Card Revenue',
      value: analytics?.giftCardRevenue || 0,
      icon: FiGift,
      color: 'bg-pink-500',
      textColor: 'text-pink-500'
    }
  ];

  // Calculate max for chart scaling
  const maxRevenue = Math.max(...stats.map(s => s.totalRevenue || 0), 1);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <FiDollarSign className="w-8 h-8 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revenue Analytics</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRevenueData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <FiDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quick Filter
            </label>
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">or</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {revenueCards.map((card) => (
          <div key={card.title} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className={`text-2xl font-bold ${card.textColor}`}>
              {formatPrice(card.value)}
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{card.title}</p>
          </div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total Transactions</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {analytics?.totalTransactions || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Average Order Value</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(analytics?.averageOrderValue || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Total Refunds</p>
          <p className="text-3xl font-bold text-red-500">
            {formatPrice(analytics?.totalRefunds || 0)}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Revenue Trend
        </h2>
        {stats.length > 0 ? (
          <div className="space-y-4">
            {stats.slice(-14).map((item, index) => (
              <div key={item._id} className="flex items-center gap-4">
                <div className="w-24 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item._id).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex gap-1 h-6 items-center">
                    {/* Order Revenue Bar */}
                    <div 
                      className="bg-blue-500 h-4 rounded-l"
                      style={{ 
                        width: `${((item.orderRevenue || 0) / maxRevenue) * 100}%`,
                        minWidth: item.orderRevenue > 0 ? '4px' : '0'
                      }}
                    />
                    {/* Subscription Revenue Bar */}
                    <div 
                      className="bg-purple-500 h-4 rounded-r"
                      style={{ 
                        width: `${((item.subscriptionRevenue || 0) / maxRevenue) * 100}%`,
                        minWidth: item.subscriptionRevenue > 0 ? '4px' : '0'
                      }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right text-sm font-medium text-gray-900 dark:text-white">
                  {formatPrice(item.totalRevenue || 0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No revenue data for this period
          </p>
        )}
        
        {/* Legend */}
        <div className="flex gap-6 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Orders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Subscriptions</span>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Revenue Breakdown by Type
        </h2>
        <div className="space-y-4">
          {analytics?.breakdown?.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {item._id === 'order' && <FiShoppingBag className="w-5 h-5 text-blue-500" />}
                {item._id === 'subscription' && <FaCrown className="w-5 h-5 text-purple-500" />}
                {item._id === 'gift_card' && <FiGift className="w-5 h-5 text-pink-500" />}
                {item._id === 'refund' && <FiTrendingDown className="w-5 h-5 text-red-500" />}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white capitalize">
                    {item._id || 'Other'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.count} transactions
                  </p>
                </div>
              </div>
              <p className={`text-xl font-bold ${item._id === 'refund' ? 'text-red-500' : 'text-green-500'}`}>
                {item._id === 'refund' ? '-' : ''}{formatPrice(item.total)}
              </p>
            </div>
          ))}
          
          {(!analytics?.breakdown || analytics.breakdown.length === 0) && (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No transactions recorded yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
