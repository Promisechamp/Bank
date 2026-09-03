const { supabase } = require('../db/supabase');
const { generateAccountNumber, constants } = require('../utils/helpers');

// Create new account
const createAccount = async (req, res, next) => {
  try {
    const { account_type, currency, user_id } = req.body;
    
    // Use provided user_id or fallback to logged in user
    const userId = user_id || req.user.id;

    // Validate account type
    if (!account_type || !constants.ACCOUNT_TYPES.includes(account_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid account type. Must be one of: ${constants.ACCOUNT_TYPES.join(', ')}`
      });
    }

    // Check if user already has an account of this type
    const { data: existing, error: checkError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('account_type', account_type)
      .eq('status', 'active');

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `User already has an active ${account_type} account`
      });
    }

    // Generate unique account number
    const account_number = generateAccountNumber();

    // Create account
    const { data: account, error } = await supabase
      .from('accounts')
      .insert([{
        user_id: userId,
        account_number,
        account_type,
        currency: currency || constants.CURRENCY,
        balance: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    // Get user profile details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, address, role, status')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Continue even if profile fetch fails
    }

    res.status(201).json({
      success: true,
      message: `${account_type} account created successfully`,
      account: {
        ...account,
        user: profile || null
      }
    });

  } catch (error) {
    console.error('Create Account Error:', error);
    next(error);
  }
};

// Get all accounts for logged-in user
const listAccounts = async (req, res, next) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          address,
          role,
          status,
          profile_image
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      accounts
    });

  } catch (error) {
    console.error('List Accounts Error:', error);
    next(error);
  }
};


// accountController.js (add this near the other exports)

// ============================================
// CHECK ACCOUNT EXISTENCE BY ACCOUNT NUMBER
// ============================================
const checkAccountExists = async (req, res, next) => {
  try {
    const { accountNumber } = req.params;

    if (!accountNumber) {
      return res.status(400).json({ success: false, error: 'Account number is required' });
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        id,
        account_number,
        account_type,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('account_number', accountNumber)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw error;

    if (!account) {
      return res.json({
        success: true,
        exists: false,
        message: 'Account not found'
      });
    }

    res.json({
      success: true,
      exists: true,
      account: {
        id: account.id,
        account_number: account.account_number,
        account_type: account.account_type,
        owner_name: account.profiles?.full_name || 'Unknown',
        owner_email: account.profiles?.email || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Check Account Existence Error:', error);
    next(error);
  }
};



// Get single account details
const getAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          address,
          role,
          status,
          profile_image
        )
      `)
      .eq('id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      throw error;
    }

    // Check if user owns this account or is admin
    const isOwner = account.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@bank.com';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this account.'
      });
    }

    res.json({
      success: true,
      account
    });

  } catch (error) {
    console.error('Get Account Error:', error);
    next(error);
  }
};

// Get account balance
const getBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const { data: account, error } = await supabase
      .from('accounts')
      .select('balance, account_number, account_type, user_id')
      .eq('id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      throw error;
    }

    // Check if user owns this account or is admin
    const isOwner = account.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@bank.com';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this account.'
      });
    }

    res.json({
      success: true,
      balance: account.balance,
      account_number: account.account_number,
      account_type: account.account_type,
      currency: constants.CURRENCY
    });

  } catch (error) {
    console.error('Get Balance Error:', error);
    next(error);
  }
};

// Close account
const closeAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    // Check if account exists and belongs to user
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance, user_id')
      .eq('id', accountId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }
      throw fetchError;
    }

    // Check if user owns this account or is admin
    const isOwner = account.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin' || req.user.email === 'admin@bank.com';
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not own this account.'
      });
    }

    // Check if account has balance
    if (account.balance > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot close account with positive balance. Please withdraw all funds first.'
      });
    }

    // Update account status
    const { data: updated, error } = await supabase
      .from('accounts')
      .update({ status: 'closed' })
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Account closed successfully',
      account: updated
    });

  } catch (error) {
    console.error('Close Account Error:', error);
    next(error);
  }
};

// Admin: Get all accounts (with user details)
const adminGetAllAccounts = async (req, res, next) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          address,
          role,
          status,
          profile_image
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Admin Get All Accounts Error:', error);
    next(error);
  }
};

// Admin: Update account status (active/frozen/closed/banned)
const adminUpdateAccountStatus = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'frozen', 'closed', 'banned'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active", "frozen", "closed", or "banned"'
      });
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .update({ status })
      .eq('id', accountId)
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email,
          phone,
          address,
          role,
          status,
          profile_image
        )
      `)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Account ${status} successfully`,
      account
    });
  } catch (error) {
    console.error('Admin Update Account Status Error:', error);
    next(error);
  }
};

// Admin: Delete account (and all transactions)
const adminDeleteAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    // First delete all transactions for this account
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', accountId);

    if (txError) throw txError;

    // Then delete the account
    const { error: accountError } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);

    if (accountError) throw accountError;

    res.json({
      success: true,
      message: 'Account and all associated transactions deleted successfully'
    });
  } catch (error) {
    console.error('Admin Delete Account Error:', error);
    next(error);
  }
};

module.exports = {
  createAccount,
  listAccounts,
		checkAccountExists,
  getAccount,
  getBalance,
  closeAccount,
  adminGetAllAccounts,
  adminUpdateAccountStatus,
  adminDeleteAccount
};