const { supabase } = require('../db/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // 🔥 Distinguish network/timeout errors from auth failures
    console.error('Authentication service error:', error.message);

    // Check if it's a network/timeout error
    const isNetworkError = 
      error.message?.includes('fetch failed') ||
      error.message?.includes('ConnectTimeoutError') ||
      error.message?.includes('ECONNREFUSED') ||
      error.message?.includes('ENOTFOUND') ||
      error.code === 'UND_ERR_CONNECT_TIMEOUT';

    if (isNetworkError) {
      return res.status(503).json({ 
        success: false, 
        error: 'Authentication service temporarily unavailable. Please try again later.' 
      });
    }

    // For any other unexpected error, return 401 to be safe
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

module.exports = { authenticate };