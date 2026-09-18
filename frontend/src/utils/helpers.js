// Format currency
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Format date with proper error handling
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format date only (no time)
export const formatDateOnly = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Format time only
export const formatTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return 'Invalid time';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Format account number (show last 4 digits)
export const formatAccountNumber = (number) => {
  if (!number) return '';
  const str = String(number);
  if (str.length <= 4) return str;
  return `••••${str.slice(-4)}`;
};






// Get transaction icon name
export const getTransactionIcon = (type) => {
  switch(type) {
    case 'credit':
      return 'ArrowDownCircle';
    case 'debit':
      return 'ArrowUpCircle';
    case 'transfer':
      return 'ArrowRightCircle';
    default:
      return 'Circle';
  }
};

// Get transaction color
export const getTransactionColor = (type) => {
  switch(type) {
    case 'credit':
      return 'text-green-600';
    case 'debit':
      return 'text-red-600';
    case 'transfer':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
};

// Get account type badge color
export const getAccountTypeColor = (type) => {
  switch(type) {
    case 'checking':
      return 'bg-blue-100 text-blue-800';
    case 'savings':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get status badge color
export const getStatusColor = (status) => {
  switch(status?.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    case 'suspended':
      return 'bg-red-100 text-red-800';
    case 'frozen':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Validate amount
export const validateAmount = (amount) => {
  return amount > 0 && !isNaN(amount) && isFinite(amount);
};

// Generate unique reference
export const generateReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

// Generate unique account number
export const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}-${random}`;
};

// Constants
export const constants = {
  ACCOUNT_TYPES: ['savings', 'checking'],
  TRANSACTION_TYPES: ['credit', 'debit', 'transfer'],
  TRANSACTION_STATUS: ['pending', 'completed', 'failed', 'cancelled'],
  CURRENCY: 'USD'
};