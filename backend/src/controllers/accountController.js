const { supabase } = require('../db/supabase');
const {
  generateAccountNumber,
  constants
} = require('../utils/helpers');

const {
  createAndSendNotification
} = require('../utils/notifications');


// ============================================================
// HELPERS
// ============================================================

const isAdmin = (req) => {
  return (
    req.user?.role === 'admin' ||
    
  );
};


// ============================================================
// CREATE NEW ACCOUNT
// ============================================================

const createAccount = async (req, res, next) => {
  try {
    const {
      account_type,
      currency,
      user_id
    } = req.body;

    // ----------------------------------------------------------
    // Determine account owner
    //
    // Normal users can only create accounts for themselves.
    // Admins may create an account for another user.
    // ----------------------------------------------------------

    const userId =
      isAdmin(req) && user_id
        ? user_id
        : req.user.id;


    // ----------------------------------------------------------
    // Validate account type
    // ----------------------------------------------------------

    if (
      !account_type ||
      !constants.ACCOUNT_TYPES.includes(account_type)
    ) {
      return res.status(400).json({
        success: false,
        error: `Invalid account type. Must be one of: ${constants.ACCOUNT_TYPES.join(', ')}`
      });
    }


    // ----------------------------------------------------------
    // Check whether user already has an active account
    // of this type
    // ----------------------------------------------------------

    const {
      data: existing,
      error: checkError
    } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('account_type', account_type)
      .eq('status', 'active');

    if (checkError) {
      throw checkError;
    }

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: `User already has an active ${account_type} account`
      });
    }


    // ----------------------------------------------------------
    // Fetch profile BEFORE creating notification/email
    // ----------------------------------------------------------

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        address,
        role,
        status,
        profile_image
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error(
        'Profile fetch error:',
        profileError.message
      );
    }


    // ----------------------------------------------------------
    // Generate unique account number
    // ----------------------------------------------------------

    const account_number = generateAccountNumber();


    // ----------------------------------------------------------
    // Create account
    // ----------------------------------------------------------

    const {
      data: account,
      error: accountError
    } = await supabase
      .from('accounts')
      .insert([
        {
          user_id: userId,
          account_number,
          account_type,
          currency: currency || constants.CURRENCY,
          balance: 0,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (accountError) {
      throw accountError;
    }


    // ----------------------------------------------------------
    // In-app notification + welcome email
    //
    // notification.js recognizes:
    //
    // template: 'welcome'
    //
    // and automatically calls welcomeEmail().
    // ----------------------------------------------------------

    const io = req.app.get('io');

    await createAndSendNotification(
      io,
      userId,
      'system',
      `Account Created – ${account_type}`,
      `Your ${account_type} account (${account_number}) has been successfully created.`,
      account.id,
      {
        template: 'welcome',

        userName:
          profile?.full_name ||
          'Customer',

        userEmail:
          profile?.email ||
          null,

        accountNumber:
          account.account_number,

        accountType:
          account.account_type,

        balance:
          account.balance
      }
    );


    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: `${account_type} account created successfully`,
      account: {
        ...account,
        user: profile || null
      }
    });

  } catch (error) {
    console.error(
      'Create Account Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET ALL ACCOUNTS FOR LOGGED-IN USER
// ============================================================

const listAccounts = async (req, res, next) => {
  try {
    const {
      data: accounts,
      error
    } = await supabase
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
      .order('created_at', {
        ascending: false
      });

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      accounts
    });

  } catch (error) {
    console.error(
      'List Accounts Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// CHECK ACCOUNT EXISTENCE BY ACCOUNT NUMBER
// ============================================================

const checkAccountExists = async (req, res, next) => {
  try {
    const {
      accountNumber
    } = req.params;

    if (!accountNumber) {
      return res.status(400).json({
        success: false,
        error: 'Account number is required'
      });
    }


    const {
      data: account,
      error
    } = await supabase
      .from('accounts')
      .select(`
        id,
        account_number,
        account_type,
        status,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('account_number', accountNumber)
      //.eq('status', 'active')
      .maybeSingle();

    if (error) {
      throw error;
    }


    if (!account) {
      return res.json({
        success: true,
        exists: false,
        message: 'Account not found'
      });
    }


    return res.json({
      success: true,
      exists: true,
      account: {
        id: account.id,
        account_number: account.account_number,
        account_type: account.account_type,
        owner_name:
          account.profiles?.full_name ||
          'Unknown',
        owner_email:
          account.profiles?.email ||
          'Unknown'
      }
    });

  } catch (error) {
    console.error(
      'Check Account Existence Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET SINGLE ACCOUNT DETAILS
// ============================================================

const getAccount = async (req, res, next) => {
  try {
    const {
      accountId
    } = req.params;


    const {
      data: account,
      error
    } = await supabase
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


    const owner =
      account.user_id === req.user.id;

    const admin =
      isAdmin(req);


    if (!owner && !admin) {
      return res.status(403).json({
        success: false,
        error:
          'Access denied. You do not own this account.'
      });
    }


    return res.json({
      success: true,
      account
    });

  } catch (error) {
    console.error(
      'Get Account Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// GET ACCOUNT BALANCE
// ============================================================

const getBalance = async (req, res, next) => {
  try {
    const {
      accountId
    } = req.params;


    const {
      data: account,
      error
    } = await supabase
      .from('accounts')
      .select(`
        balance,
        account_number,
        account_type,
        currency,
        user_id
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


    const owner =
      account.user_id === req.user.id;

    const admin =
      isAdmin(req);


    if (!owner && !admin) {
      return res.status(403).json({
        success: false,
        error:
          'Access denied. You do not own this account.'
      });
    }


    return res.json({
      success: true,
      balance: account.balance,
      account_number: account.account_number,
      account_type: account.account_type,
      currency:
        account.currency ||
        constants.CURRENCY
    });

  } catch (error) {
    console.error(
      'Get Balance Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// CLOSE ACCOUNT
// ============================================================

const closeAccount = async (req, res, next) => {
  try {
    const {
      accountId
    } = req.params;


    // ----------------------------------------------------------
    // Fetch account
    // ----------------------------------------------------------

    const {
      data: account,
      error: fetchError
    } = await supabase
      .from('accounts')
      .select(`
        balance,
        user_id,
        account_number,
        account_type
      `)
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


    // ----------------------------------------------------------
    // Authorization
    // ----------------------------------------------------------

    const owner =
      account.user_id === req.user.id;

    const admin =
      isAdmin(req);


    if (!owner && !admin) {
      return res.status(403).json({
        success: false,
        error:
          'Access denied. You do not own this account.'
      });
    }


    // ----------------------------------------------------------
    // Prevent closing account with money
    // ----------------------------------------------------------

    if (Number(account.balance) > 0) {
      return res.status(400).json({
        success: false,
        error:
          'Cannot close account with positive balance. Please withdraw all funds first.'
      });
    }


    // ----------------------------------------------------------
    // Close account
    // ----------------------------------------------------------

    const {
      data: updated,
      error
    } = await supabase
      .from('accounts')
      .update({
        status: 'closed'
      })
      .eq('id', accountId)
      .select()
      .single();


    if (error) {
      throw error;
    }


    // ----------------------------------------------------------
    // In-app notification
    // ----------------------------------------------------------

    const io = req.app.get('io');

    await createAndSendNotification(
      io,
      account.user_id,
      'system',
      `Account Closed – ${account.account_type}`,
      `Your ${account.account_type} account (${account.account_number}) has been closed.`,
      accountId
    );


    return res.json({
      success: true,
      message: 'Account closed successfully',
      account: updated
    });

  } catch (error) {
    console.error(
      'Close Account Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// ADMIN: GET ACCOUNT BY ID
// ============================================================

const adminGetAccountById = async (req, res, next) => {
  try {
    const {
      accountId
    } = req.params;


    const {
      data: account,
      error
    } = await supabase
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


    return res.json({
      success: true,
      account
    });

  } catch (error) {
    console.error(
      'Admin Get Account Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// ADMIN: GET ALL ACCOUNTS
// ============================================================

const adminGetAllAccounts = async (req, res, next) => {
  try {
    const {
      data: accounts,
      error
    } = await supabase
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
      .order('created_at', {
        ascending: false
      });


    if (error) {
      throw error;
    }


    return res.json({
      success: true,
      accounts
    });

  } catch (error) {
    console.error(
      'Admin Get All Accounts Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// ADMIN: UPDATE ACCOUNT STATUS
// ============================================================

const adminUpdateAccountStatus = async (
  req,
  res,
  next
) => {
  try {
    const {
      accountId
    } = req.params;

    const {
      status
    } = req.body;


    const allowedStatuses = [
      'active',
      'frozen',
      'closed',
      'banned'
    ];


    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error:
          'Invalid status. Must be "active", "frozen", "closed", or "banned"'
      });
    }


    const {
      data: account,
      error
    } = await supabase
      .from('accounts')
      .update({
        status
      })
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


    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      throw error;
    }


    return res.json({
      success: true,
      message:
        `Account ${status} successfully`,
      account
    });

  } catch (error) {
    console.error(
      'Admin Update Account Status Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// ADMIN: DELETE ACCOUNT
// ============================================================

const adminDeleteAccount = async (
  req,
  res,
  next
) => {
  try {
    const {
      accountId
    } = req.params;


    // ----------------------------------------------------------
    // Fetch account first
    // ----------------------------------------------------------

    const {
      data: account,
      error: fetchError
    } = await supabase
      .from('accounts')
      .select(`
        user_id,
        account_number,
        account_type
      `)
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


    // ----------------------------------------------------------
    // Delete transactions
    // ----------------------------------------------------------

    const {
      error: transactionError
    } = await supabase
      .from('transactions')
      .delete()
      .eq('account_id', accountId);


    if (transactionError) {
      throw transactionError;
    }


    // ----------------------------------------------------------
    // Delete account
    // ----------------------------------------------------------

    const {
      error: accountError
    } = await supabase
      .from('accounts')
      .delete()
      .eq('id', accountId);


    if (accountError) {
      throw accountError;
    }


    // ----------------------------------------------------------
    // Notify user
    // ----------------------------------------------------------

    const io = req.app.get('io');

    await createAndSendNotification(
      io,
      account.user_id,
      'system',
      `Account Deleted – ${account.account_type}`,
      `Your ${account.account_type} account (${account.account_number}) has been permanently deleted by an administrator.`,
      accountId
    );


    return res.json({
      success: true,
      message:
        'Account and all associated transactions deleted successfully'
    });

  } catch (error) {
    console.error(
      'Admin Delete Account Error:',
      error
    );

    next(error);
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createAccount,
  listAccounts,
  checkAccountExists,
  getAccount,
  getBalance,
  closeAccount,
  adminGetAccountById,
  adminGetAllAccounts,
  adminUpdateAccountStatus,
  adminDeleteAccount
};