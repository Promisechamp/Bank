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
  return req.user?.role === 'admin';
};


// ============================================================
// ROUTING NUMBER GENERATOR
//
// Generates a valid 9-digit ABA routing number using the
// standard ABA checksum:
//
//   3(d1 + d4 + d7) + 7(d2 + d5 + d8) + 1(d3 + d6 + d9) ≡ 0 (mod 10)
//
// The first 8 digits are random, and the 9th is the
// checksum digit computed from the first 8.
// ============================================================

const generateRoutingNumber = () => {
  const digits = [];

  for (let i = 0; i < 8; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }

  const sum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5]);

  const checkDigit = (10 - (sum % 10)) % 10;

  digits.push(checkDigit);

  return digits.join('');
};


// ============================================================
// SWIFT / BIC CODE GENERATOR
//
// Format: BBBBCCLL (8 characters)
//
//   BBBB  → 4-letter bank code
//   CC    → 2-letter country code
//   LL    → 2-letter location code
//
// Uses the processing bank identifier so the code is
// consistent with what the receipts display.
// ============================================================

const PROCESSING_BANK_SWIFT_PREFIX = 'TRCU'; // Trusty Credit Union
const PROCESSING_BANK_COUNTRY = 'US';

const generateSwiftCode = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const location =
    letters[Math.floor(Math.random() * 26)] +
    letters[Math.floor(Math.random() * 26)];

  return `${PROCESSING_BANK_SWIFT_PREFIX}${PROCESSING_BANK_COUNTRY}${location}`;
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
    // Generate unique account identifiers
    //
    //   account_number  → random, unique per account
    //   routing_number  → valid 9-digit ABA routing number
    //   swift_code      → 8-character BIC-style code
    //
    // Both routing_number and swift_code follow the exact
    // column names used across the receipt and admin UI
    // (snake_case: swift_code, routing_number).
    // ----------------------------------------------------------

    const account_number = generateAccountNumber();
    const routing_number = generateRoutingNumber();
    const swift_code = generateSwiftCode();


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
          routing_number,
          swift_code,
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

        routingNumber:
          account.routing_number,

        swiftCode:
          account.swift_code,

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
// ADMIN: UPDATE ACCOUNT BALANCE
// ============================================================
const adminUpdateAccountBalance = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const {
      balance,       // new balance (number) — optional if reset=true
      reset,         // if true, force balance to 0
      sendAlert,     // notify the user
      reason         // optional note for notification / log
    } = req.body;

    // ----------------------------------------------------------
    // Determine target balance
    // ----------------------------------------------------------
    let newBalance;

    if (reset === true || reset === 'true') {
      newBalance = 0;
    } else if (balance !== undefined && balance !== null && balance !== '') {
      newBalance = parseFloat(balance);
      if (isNaN(newBalance) || newBalance < 0) {
        return res.status(400).json({
          success: false,
          error: 'Balance must be a non-negative number'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide a numeric "balance" or set "reset": true to zero it out'
      });
    }

    // ----------------------------------------------------------
    // Fetch account (with profile for notification)
    // ----------------------------------------------------------
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          email
        )
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

    const oldBalance = parseFloat(account.balance) || 0;
    const delta = newBalance - oldBalance;

    // ----------------------------------------------------------
    // No-op check
    // ----------------------------------------------------------
    if (delta === 0) {
      return res.json({
        success: true,
        message: 'Balance already set to the requested value',
        account,
        old_balance: oldBalance,
        new_balance: newBalance
      });
    }

    // ----------------------------------------------------------
    // Update balance
    // ----------------------------------------------------------
    const { data: updated, error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
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

    if (updateError) {
      console.error('Balance update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update account balance'
      });
    }

    // ----------------------------------------------------------
    // Optional: record an adjustment transaction for audit trail
    // (only when there is a real change)
    // ----------------------------------------------------------
    const reference =
      'ADJ-' +
      Date.now().toString(36).toUpperCase() +
      '-' +
      Math.random().toString(36).substring(2, 8).toUpperCase();

    const txType = delta > 0 ? 'credit' : 'debit';
    const absDelta = Math.abs(delta);

    const { error: txError } = await supabase
      .from('transactions')
      .insert([{
        account_id: accountId,
        transaction_type: txType,
        amount: absDelta,
        description:
          reason ||
          (newBalance === 0
            ? 'Administrative balance reset to zero'
            : `Administrative balance adjustment`),
        reference_id: reference,
        status: 'completed',
        metadata: {
          adminAdjustment: true,
          adjustedBy: req.user?.id || null,
          adjustedAt: new Date().toISOString(),
          oldBalance,
          newBalance,
          delta,
          reason: reason || null
        }
      }]);

    if (txError) {
      console.warn('⚠️ Adjustment transaction log failed:', txError);
    }


    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------
    return res.json({
      success: true,
      message:
        newBalance === 0
          ? `Balance reset to 0 for account ${account.account_number}`
          : `Balance updated to ${newBalance.toFixed(2)} for account ${account.account_number}`,
      account: updated,
      old_balance: oldBalance,
      new_balance: newBalance,
      delta,
      reference
    });

  } catch (error) {
    console.error('Admin Update Account Balance Error:', error);
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
  adminDeleteAccount,
		adminUpdateAccountBalance,
};