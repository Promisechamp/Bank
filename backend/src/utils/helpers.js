// Generate unique transaction reference
const generateReference = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 6);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

// Generate unique account number
const generateAccountNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
};

// Validate email format
const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

// Validate amount (positive number)
const validateAmount = (amount) => {
  return amount > 0 && !isNaN(amount) && isFinite(amount);
};

// Format currency
const formatCurrency = (amount) => {
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


// Constants
const constants = {
  ACCOUNT_TYPES: ['savings', 'checking'],
  TRANSACTION_TYPES: ['credit', 'debit', 'transfer'],
  TRANSACTION_STATUS: ['pending_review', 'completed', 'failed', 'cancelled'],
  CURRENCY: 'USD'
};

module.exports = {
  generateReference,
  generateAccountNumber,
  validateEmail,
  validateAmount,
		formatCurrency,
  constants
};