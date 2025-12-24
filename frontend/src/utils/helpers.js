export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(0);
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj);
  } catch {
    return 'N/A';
  }
};

// Safe date parsing - returns null for invalid dates
export const safeParseDate = (date) => {
  if (!date) return null;
  try {
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  } catch {
    return null;
  }
};

// Safe date comparison - checks if a date is valid before comparison
export const isValidDate = (date) => {
  if (!date) return false;
  try {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
};

// Safe toLocaleDateString
export const safeToLocaleDateString = (date, options = {}) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleDateString('en-US', options);
  } catch {
    return 'N/A';
  }
};

// Safe toLocaleString
export const safeToLocaleString = (date, options = {}) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleString('en-US', options);
  } catch {
    return 'N/A';
  }
};

// Safe toLocaleTimeString
export const safeToLocaleTimeString = (date, options = {}) => {
  if (!date) return 'N/A';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'N/A';
    return dateObj.toLocaleTimeString('en-US', options);
  } catch {
    return 'N/A';
  }
};

// Calculate days difference safely
export const safeDaysDifference = (date1, date2) => {
  try {
    const d1 = new Date(date1);
    const d2 = date2 ? new Date(date2) : new Date();
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

// Check if date is within specified days from now
export const isWithinDays = (date, days) => {
  if (!date || !isValidDate(date)) return false;
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));
    return diffDays <= days;
  } catch {
    return false;
  }
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getOrderStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'badge-warning';
    case 'Confirmed':
      return 'badge-info';
    case 'Processing':
      return 'badge-info';
    case 'Paid':
      return 'badge-info';
    case 'Shipped':
      return 'badge-info';
    case 'Out for Delivery':
      return 'badge-info';
    case 'Delivered':
      return 'badge-success';
    case 'Return Requested':
      return 'badge-warning';
    case 'Returned':
      return 'badge-danger';
    case 'Cancelled':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};

export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'badge-success';
    case 'unpaid':
      return 'badge-warning';
    case 'refunded':
      return 'badge-danger';
    default:
      return 'badge-info';
  }
};
