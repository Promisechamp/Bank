// middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  // Check if user is admin
  // You can use a specific admin email or a role field in profiles
  const adminEmails = ['admin@bank.com', 'admin@example.com'];
  
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Please login'
    });
  }

  // Check if user email is in admin list
  // Or you can add a role field to profiles table
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden - Admin access required'
    });
  }

  next();
};

module.exports = { adminAuth };