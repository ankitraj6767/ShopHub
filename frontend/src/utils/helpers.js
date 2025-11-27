export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getOrderStatusColor = (status) => {
  switch (status) {
    case 'Pending':
      return 'badge-warning';
    case 'Paid':
      return 'badge-info';
    case 'Shipped':
      return 'badge-info';
    case 'Delivered':
      return 'badge-success';
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
