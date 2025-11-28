import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiPackage,
  FiTruck,
  FiCheckCircle,
  FiMapPin,
  FiCalendar,
  FiDownload,
  FiArrowLeft,
} from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice, formatDate } from '../utils/helpers';
import Spinner from '../components/ui/Spinner';

const OrderTrackingPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Failed to fetch order');
    }
    setLoading(false);
  };

  const getTrackingSteps = () => {
    const steps = [
      { key: 'ordered', label: 'Order Placed', icon: FiPackage, description: 'Your order has been placed' },
      { key: 'confirmed', label: 'Confirmed', icon: FiCheckCircle, description: 'Order confirmed by seller' },
      { key: 'shipped', label: 'Shipped', icon: FiTruck, description: 'Package is on the way' },
      { key: 'out_for_delivery', label: 'Out for Delivery', icon: FiMapPin, description: 'Package is nearby' },
      { key: 'delivered', label: 'Delivered', icon: FiCheckCircle, description: 'Package delivered' },
    ];

    const statusMap = {
      'Pending': 0,
      'Processing': 1,
      'Paid': 1,
      'Shipped': 2,
      'Out for Delivery': 3,
      'Delivered': 4,
      'Cancelled': -1,
    };

    const currentStep = statusMap[order?.status] ?? 0;

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentStep,
      current: index === currentStep,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
        <Link to="/orders" className="btn-primary">View All Orders</Link>
      </div>
    );
  }

  const trackingSteps = getTrackingSteps();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/orders" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <FiArrowLeft className="mr-2" /> Back to Orders
      </Link>

      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
            <p className="text-gray-500">Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Estimated Delivery</p>
              <p className="font-semibold text-gray-900">
                {order.estimatedDelivery 
                  ? formatDate(order.estimatedDelivery)
                  : formatDate(new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            <button className="btn-secondary flex items-center gap-2">
              <FiDownload /> Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Shipment Progress</h2>
        
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {trackingSteps.map((step, index) => (
            <div key={step.key} className="relative flex items-start mb-8 last:mb-0">
              {/* Icon Circle */}
              <div
                className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.current
                    ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3
                    className={`font-medium ${
                      step.completed ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </h3>
                  {step.completed && order.tracking?.[step.key] && (
                    <span className="text-sm text-gray-500">
                      {formatDate(order.tracking[step.key])}
                    </span>
                  )}
                </div>
                <p className={`text-sm ${step.completed ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMapPin /> Shipping Address
          </h2>
          <div className="text-gray-600">
            <p className="font-medium text-gray-900">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.postalCode}
            </p>
            <p>{order.shippingAddress?.country}</p>
            {order.shippingAddress?.phone && <p className="mt-2">Phone: {order.shippingAddress.phone}</p>}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiCalendar /> Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date</span>
              <span className="font-medium">{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items</span>
              <span className="font-medium">{order.orderItems?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium text-primary-600">{formatPrice(order.totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Status</span>
              <span className={`font-medium ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                {order.isPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
          {order.orderItems?.map((item, index) => (
            <div key={index} className="flex gap-4 p-4 border rounded-lg">
              <img
                src={item.image || item.product?.images?.[0]?.url || 'https://via.placeholder.com/80'}
                alt={item.name || item.product?.name}
                className="w-20 h-20 object-cover rounded"
              />
              <div className="flex-1">
                <Link
                  to={`/products/${item.product?._id || item.product}`}
                  className="font-medium text-gray-900 hover:text-primary-600"
                >
                  {item.name || item.product?.name}
                </Link>
                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                <p className="font-medium text-primary-600">{formatPrice(item.price)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
