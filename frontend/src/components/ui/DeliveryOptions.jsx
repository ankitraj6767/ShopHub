import { useState } from 'react';
import { Calendar, Clock, Truck, Home, ChevronDown, ChevronUp, Check } from 'lucide-react';

const DeliveryOptions = ({ deliveryOptions, onDeliveryOptionsChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Generate next 7 days for delivery date selection
  const getDeliveryDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 2; i <= 8; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
      });
    }
    return dates;
  };

  const deliveryDates = getDeliveryDates();

  const deliverySlots = [
    { id: 'morning', label: 'Morning', time: '8 AM - 12 PM', icon: '🌅' },
    { id: 'afternoon', label: 'Afternoon', time: '12 PM - 5 PM', icon: '☀️' },
    { id: 'evening', label: 'Evening', time: '5 PM - 9 PM', icon: '🌆' },
    { id: 'anytime', label: 'Anytime', time: 'Standard Delivery', icon: '📦' },
  ];

  const handleChange = (field, value) => {
    onDeliveryOptionsChange({
      ...deliveryOptions,
      [field]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
            <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-white">Delivery Options</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Choose your preferred delivery date & time
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 space-y-6">
          {/* Delivery Date Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Calendar className="w-4 h-4" />
              Select Delivery Date
            </label>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {deliveryDates.map((dateOption) => (
                <button
                  key={dateOption.date}
                  onClick={() => handleChange('preferredDeliveryDate', dateOption.date)}
                  className={`p-3 rounded-lg border-2 text-center transition ${
                    deliveryOptions.preferredDeliveryDate === dateOption.date
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dateOption.label.split(' ')[0]}
                  </div>
                  <div className={`font-medium ${
                    deliveryOptions.preferredDeliveryDate === dateOption.date
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {dateOption.label.split(' ')[2]}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {dateOption.label.split(' ')[1]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Time Slot */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              <Clock className="w-4 h-4" />
              Select Delivery Time
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {deliverySlots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleChange('preferredDeliverySlot', slot.id)}
                  className={`p-4 rounded-lg border-2 text-center transition ${
                    deliveryOptions.preferredDeliverySlot === slot.id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{slot.icon}</div>
                  <div className={`font-medium ${
                    deliveryOptions.preferredDeliverySlot === slot.id
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {slot.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {slot.time}
                  </div>
                  {deliveryOptions.preferredDeliverySlot === slot.id && (
                    <Check className="w-4 h-4 mx-auto mt-2 text-primary-600 dark:text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Instructions (optional)
            </label>
            <textarea
              value={deliveryOptions.deliveryInstructions}
              onChange={(e) => handleChange('deliveryInstructions', e.target.value)}
              placeholder="E.g., Ring the doorbell twice, call upon arrival..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Leave at Door Option */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={deliveryOptions.leaveAtDoor}
              onChange={(e) => handleChange('leaveAtDoor', e.target.checked)}
              className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
            />
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Leave at door if I'm not home
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  We'll take a photo of the delivery for confirmation
                </p>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
};

export default DeliveryOptions;
