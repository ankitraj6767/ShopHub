import { useState } from 'react';
import { FiFacebook, FiTwitter, FiLink, FiMail, FiShare2, FiX } from 'react-icons/fi';
import { FaWhatsapp, FaPinterest } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ShareProduct = ({ product, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const productUrl = `${window.location.origin}/products/${product._id}`;
  const shareText = `Check out ${product.name} on ShopHub!`;

  const shareLinks = [
    {
      name: 'Facebook',
      icon: FiFacebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`,
    },
    {
      name: 'Twitter',
      icon: FiTwitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(productUrl)}`,
    },
    {
      name: 'WhatsApp',
      icon: FaWhatsapp,
      color: 'bg-green-500 hover:bg-green-600',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${productUrl}`)}`,
    },
    {
      name: 'Pinterest',
      icon: FaPinterest,
      color: 'bg-red-600 hover:bg-red-700',
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(product.images?.[0]?.url || '')}&description=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: FiMail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(`${shareText}\n\n${productUrl}`)}`,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (url) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShare2 /> Share this product
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
          <img
            src={product.images?.[0]?.url || 'https://via.placeholder.com/80'}
            alt={product.name}
            className="w-16 h-16 object-cover rounded"
          />
          <div className="flex-1">
            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">₹{product.price?.toFixed(2)}</p>
          </div>
        </div>

        {/* Social Share Buttons */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => handleShare(link.url)}
              className={`${link.color} text-white p-3 rounded-lg flex items-center justify-center transition`}
              title={`Share on ${link.name}`}
            >
              <link.icon className="w-5 h-5" />
            </button>
          ))}
        </div>

        {/* Copy Link */}
        <div className="flex gap-2">
          <input
            type="text"
            value={productUrl}
            readOnly
            className="flex-1 px-3 py-2 border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-300"
          />
          <button
            onClick={copyToClipboard}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              copied 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
            }`}
          >
            <FiLink className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareProduct;
