import { useState } from 'react';
import { Gift, MessageSquare, Mail, Package, ChevronDown, ChevronUp } from 'lucide-react';

const GiftOptions = ({ giftOptions, onGiftOptionsChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field, value) => {
    onGiftOptionsChange({
      ...giftOptions,
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
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg">
            <Gift className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="text-left">
            <h3 className="font-medium text-gray-900 dark:text-white">Gift Options</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add gift wrap & personal message
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
        <div className="p-4 pt-0 space-y-4">
          {/* Gift Wrap Toggle */}
          <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <span className="font-medium text-gray-900 dark:text-white">
                  Add Gift Wrap
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Premium gift wrapping with ribbon
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                +₹499
              </span>
              <input
                type="checkbox"
                checked={giftOptions.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
                className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500"
              />
            </div>
          </label>

          {giftOptions.enabled && (
            <>
              {/* Gift Message */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Gift Message (optional)
                </label>
                <textarea
                  value={giftOptions.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  placeholder="Write a personal message for the recipient..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {giftOptions.message?.length || 0}/200 characters
                </p>
              </div>

              {/* Recipient Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recipient's Name
                  </label>
                  <input
                    type="text"
                    value={giftOptions.recipientName}
                    onChange={(e) => handleChange('recipientName', e.target.value)}
                    placeholder="Who is this gift for?"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4" />
                    Recipient's Email (optional)
                  </label>
                  <input
                    type="email"
                    value={giftOptions.recipientEmail}
                    onChange={(e) => handleChange('recipientEmail', e.target.value)}
                    placeholder="They'll receive a notification"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Gift Receipt */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftOptions.sendGiftReceipt}
                  onChange={(e) => handleChange('sendGiftReceipt', e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Include a gift receipt
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Price won't be shown on the receipt
                  </p>
                </div>
              </label>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GiftOptions;
