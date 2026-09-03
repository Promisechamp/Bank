const { supabase } = require('../db/supabase');
const { formatCurrency } = require('../utils/helpers');
const { sendEmail } = require('../email/email');
const { creditEmail, debitEmail } = require('../email/templates');
const { sendNotification } = require('../socket');


// ============================================
// USER MANAGEMENT
// ============================================

// Get all users with their profiles
const getAllUsers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // For each user, get their auth user info
    const usersWithAuth = await Promise.all(
      users.map(async (user) => {
        try {
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
          
          if (authError) throw authError;
          
          return {
            ...user,
            email: authUser.user?.email || user.email,
            email_confirmed: authUser.user?.email_confirmed_at ? true : false,
            last_sign_in: authUser.user?.last_sign_in_at || null,
            created_at: authUser.user?.created_at || user.created_at,
            updated_at: authUser.user?.updated_at || user.updated_at
          };
        } catch (e) {
          return {
            ...user,
            email_confirmed: false,
            last_sign_in: null
          };
        }
      })
    );

    res.json({
      success: true,
      users: usersWithAuth
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    next(error);
  }
};

// Get user by ID with all info including password
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      throw profileError;
    }

    let authUser = null;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (!error) authUser = data;
    } catch (e) {}

    const userData = {
      ...profile,
      email: authUser?.user?.email || profile.email,
      email_confirmed: authUser?.user?.email_confirmed_at ? true : false,
      phone_confirmed: authUser?.user?.phone_confirmed_at ? true : false,
      last_sign_in: authUser?.user?.last_sign_in_at || null,
      auth_created_at: authUser?.user?.created_at || profile.created_at,
      auth_updated_at: authUser?.user?.updated_at || profile.updated_at,
      raw_user_meta_data: authUser?.user?.raw_user_meta_data || {},
      app_metadata: authUser?.user?.app_metadata || {}
    };

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Get User By ID Error:', error);
    next(error);
  }
};

// Admin: Update user (atomic update - both succeed or both fail)
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { 
      full_name, 
      phone, 
      address, 
      role, 
      status,
      email,
      password,
      profile_image,
      date_of_birth,
      country
    } = req.body;

    console.log('🔄 Updating user:', { userId, email, password: password ? '***provided***' : 'not provided' });

    let profileUpdates = {};
    let authUpdates = {};
    let hasProfileUpdate = false;
    let hasAuthUpdate = false;

    if (full_name !== undefined) { profileUpdates.full_name = full_name; hasProfileUpdate = true; }
    if (phone !== undefined) { profileUpdates.phone = phone; hasProfileUpdate = true; }
    if (address !== undefined) { profileUpdates.address = address; hasProfileUpdate = true; }
    if (role !== undefined) { profileUpdates.role = role; hasProfileUpdate = true; }
    if (status !== undefined) { profileUpdates.status = status; hasProfileUpdate = true; }
    if (profile_image !== undefined) { profileUpdates.profile_image = profile_image; hasProfileUpdate = true; }
    if (date_of_birth !== undefined) { profileUpdates.date_of_birth = date_of_birth; hasProfileUpdate = true; }
    if (country !== undefined) { profileUpdates.country = country; hasProfileUpdate = true; }
    
    if (password !== undefined && password !== null && password.length > 0) {
      profileUpdates.password = password;
      authUpdates.password = password;
      hasProfileUpdate = true;
      hasAuthUpdate = true;
    }

    if (email !== undefined && email !== null && email.length > 0) {
      authUpdates.email = email;
      hasAuthUpdate = true;
    }

    if (!hasProfileUpdate && !hasAuthUpdate) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    let profileResult = null;
    let authResult = null;

    // STEP 1: Try Auth Update First
    if (hasAuthUpdate) {
      try {
        console.log('📝 Updating auth user...');
        const { data, error: authError } = await supabase.auth.admin.updateUserById(
          userId,
          authUpdates
        );
        
        if (authError) {
          console.error('❌ Auth Update Failed:', authError);
          return res.status(400).json({
            success: false,
            error: `Auth update failed: ${authError.message}`
          });
        }
        
        authResult = data;
        console.log('✅ Auth user updated successfully');
      } catch (error) {
        console.error('❌ Auth Update Exception:', error);
        return res.status(500).json({
          success: false,
          error: `Auth update failed: ${error.message}`
        });
      }
    }

    // STEP 2: If Auth succeeded, Update Profile
    if (hasProfileUpdate) {
      try {
        console.log('📝 Updating profile...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId)
          .select()
          .single();

        if (profileError) {
          console.error('❌ Profile Update Failed:', profileError);
          
          if (hasAuthUpdate) {
            console.log('🔄 Rolling back auth changes...');
            try {
              const revertData = {};
              if (email !== undefined && email !== null && email.length > 0) {
                const { data: originalProfile } = await supabase
                  .from('profiles')
                  .select('email')
                  .eq('id', userId)
                  .single();
                if (originalProfile) {
                  revertData.email = originalProfile.email;
                }
              }
              if (password !== undefined && password !== null && password.length > 0) {
                const { data: originalProfile } = await supabase
                  .from('profiles')
                  .select('password')
                  .eq('id', userId)
                  .single();
                if (originalProfile && originalProfile.password) {
                  revertData.password = originalProfile.password;
                }
              }
              if (Object.keys(revertData).length > 0) {
                await supabase.auth.admin.updateUserById(userId, revertData);
                console.log('🔄 Auth rollback completed');
              }
            } catch (rollbackError) {
              console.error('⚠️ Rollback failed:', rollbackError);
            }
          }
          
          return res.status(500).json({
            success: false,
            error: `Profile update failed: ${profileError.message}`
          });
        }

        profileResult = profile;
        console.log('✅ Profile updated successfully');
      } catch (error) {
        console.error('❌ Profile Update Exception:', error);
        
        if (hasAuthUpdate) {
          console.log('🔄 Rolling back auth changes...');
          try {
            const revertData = {};
            if (email !== undefined && email !== null && email.length > 0) {
              const { data: originalProfile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', userId)
                .single();
              if (originalProfile) {
                revertData.email = originalProfile.email;
              }
            }
            if (password !== undefined && password !== null && password.length > 0) {
              const { data: originalProfile } = await supabase
                .from('profiles')
                .select('password')
                .eq('id', userId)
                .single();
              if (originalProfile && originalProfile.password) {
                revertData.password = originalProfile.password;
              }
            }
            if (Object.keys(revertData).length > 0) {
              await supabase.auth.admin.updateUserById(userId, revertData);
              console.log('🔄 Auth rollback completed');
            }
          } catch (rollbackError) {
            console.error('⚠️ Rollback failed:', rollbackError);
          }
        }
        
        return res.status(500).json({
          success: false,
          error: `Profile update failed: ${error.message}`
        });
      }
    }

    // STEP 3: Both succeeded - Return updated user
    const { data: finalProfile, error: finalError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (finalError) {
      console.error('Final Profile Fetch Error:', finalError);
    }

    const finalUser = finalProfile || profileResult;

    let authUserInfo = null;
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      authUserInfo = data;
    } catch (e) {
      console.error('Auth User Fetch Error:', e);
    }

    const userData = {
      ...finalUser,
      email: authUserInfo?.user?.email || finalUser.email,
      password: finalUser.password || '••••••••',
      email_confirmed: authUserInfo?.user?.email_confirmed_at ? true : false,
      last_sign_in: authUserInfo?.user?.last_sign_in_at || null
    };

    console.log('✅ User updated successfully!');
    res.json({
      success: true,
      message: 'User updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('❌ Update User Error:', error);
    next(error);
  }
};

// Update user status
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active" or "suspended"'
      });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `User ${status} successfully`,
      user
    });
  } catch (error) {
    console.error('Update User Status Error:', error);
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    next(error);
  }
};

// ============================================
// ACCOUNT MANAGEMENT
// ============================================

const getAllAccounts = async (req, res, next) => {
  try {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      accounts
    });
  } catch (error) {
    console.error('Get All Accounts Error:', error);
    next(error);
  }
};


// ============================================
// GET SINGLE ACCOUNT (ADMIN)
// ============================================

const getAccountById = async (req, res, next) => {
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

    res.json({
      success: true,
      account
    });
  } catch (error) {
    console.error('Get Account By ID Error:', error);
    next(error);
  }
};

const updateAccountStatus = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'frozen', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be "active", "frozen", or "closed"'
      });
    }

    const { data: account, error } = await supabase
      .from('accounts')
      .update({ status })
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: `Account ${status} successfully`,
      account
    });
  } catch (error) {
    console.error('Update Account Status Error:', error);
    next(error);
  }
};

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

// ============================================
// GET ALL TRANSACTIONS (ADMIN) – with account filter
// ============================================
const getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, status, accountId } = req.query;

    // Build the base query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (accountId) {
      query = query.eq('account_id', accountId);
    }

    const { data: transactions, error } = await query;
    if (error) throw error;

    // Count total matching records (without pagination)
    let countQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }
    if (accountId) {
      countQuery = countQuery.eq('account_id', accountId);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    res.json({
      success: true,
      transactions,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get All Transactions Error:', error);
    next(error);
  }
};




// ✅ UPDATED: Get transaction by ID with account number
const getTransactionById = async (req, res, next) => {
  try {
    const { txId } = req.params;

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          account_number,
          user_id,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        )
      `)
      .eq('id', txId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Get Transaction By ID Error:', error);
    next(error);
  }
};




// ============================================
// UPDATE TRANSACTION (with balance adjustment)
// ============================================

// ============================================
// UPDATE TRANSACTION (with balance adjustment)
// ============================================

const updateTransaction = async (req, res, next) => {
  try {
    const { txId } = req.params;
    const { amount, description, date, status } = req.body;

    // 1. Fetch the original transaction with account info
    const { data: existing, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          id,
          balance,
          user_id
        )
      `)
      .eq('id', txId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Transaction not found' });
      }
      throw fetchError;
    }

    const { account_id, amount: oldAmount, transaction_type } = existing;
    const account = existing.accounts;
    if (!account) {
      return res.status(404).json({ success: false, error: 'Associated account not found' });
    }

    let updates = {};
    let newBalance = account.balance;
    let balanceUpdated = false;

    // 2. Handle amount change
    if (amount !== undefined && amount !== null) {
      const newAmount = parseFloat(amount);
      if (isNaN(newAmount) || newAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Amount must be a positive number' });
      }

      const old = parseFloat(oldAmount);
      const diff = newAmount - old;

      if (transaction_type === 'credit') {
        // Credit increases balance
        newBalance = account.balance + diff;
      } else if (transaction_type === 'debit') {
        // Debit decreases balance
        newBalance = account.balance + old - newAmount;
        if (newBalance < 0) {
          return res.status(400).json({
            success: false,
            error: `Insufficient balance. Available: ${formatCurrency(account.balance)}, requested debit: ${formatCurrency(newAmount)}`
          });
        }
      } else {
        // Transfers involve two accounts – handle separately or reject
        return res.status(400).json({
          success: false,
          error: 'Editing amount for transfer transactions is not supported'
        });
      }

      updates.amount = newAmount;
      balanceUpdated = true;
    }

    // 3. Apply other updates
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.created_at = date;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    // 4. Update account balance if amount changed
    if (balanceUpdated) {
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', account.id);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update account balance'
        });
      }
    }

    // 5. Update the transaction itself
    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', txId)
      .select(`
        *,
        accounts:account_id (
          account_number,
          user_id,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Transaction update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update transaction'
      });
    }

    // 6. Return the updated transaction and new balance
    res.json({
      success: true,
      message: 'Transaction updated and balance adjusted',
      transaction: updated,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('Update Transaction Error:', error);
    next(error);
  }
};




// ============================================
// APPROVE TRANSACTION
// ============================================

const approveTransaction = async (req, res, next) => {
  try {
    const { txId } = req.params;

    // --------------------------------------------------------
    // GET TRANSACTION
    // --------------------------------------------------------

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          id,
          account_number,
          user_id,
          balance,
          status,
          profiles:user_id (
            id,
            full_name,
            email,
            status
          )
        )
      `)
      .eq('id', txId)
      .single();

    if (txError) {
      if (txError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      throw txError;
    }

    // --------------------------------------------------------
    // ONLY PENDING REVIEW CAN BE APPROVED
    // --------------------------------------------------------

    if (tx.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        error: `Only transactions pending review can be approved. Current status: ${tx.status}`
      });
    }

    // --------------------------------------------------------
    // MAKE SURE THIS IS A SAME-BANK TRANSFER
    // --------------------------------------------------------

    const metadata = tx.metadata || {};

    if (
      metadata.transferType !== 'same_bank' &&
      metadata.transferType !== 'external'
    ) {
      return res.status(400).json({
        success: false,
        error: 'This transaction is not an eligible same-bank transfer.'
      });
    }

    // --------------------------------------------------------
    // GET DESTINATION ACCOUNT
    //
    // IMPORTANT:
    // The recipient account ID is stored in metadata.toAccountId
    // during transfer initiation.
    // Do NOT use tx.counterparty_account here.
    // --------------------------------------------------------

    const destinationAccountId =
  tx.counterparty_account ||
  metadata.toAccountId;

if (!destinationAccountId) {
  return res.status(400).json({
    success: false,
    error: 'Recipient account information is missing from this transaction.'
  });
}

    // Prevent sending money to the same account
    if (destinationAccountId === tx.account_id) {
      return res.status(400).json({
        success: false,
        error: 'Source and recipient accounts cannot be the same.'
      });
    }

    // --------------------------------------------------------
    // GET DESTINATION
    // --------------------------------------------------------

    const {
      data: destination,
      error: destinationError
    } = await supabase
      .from('accounts')
      .select(`
        id,
        account_number,
        balance,
        status,
        user_id,
        profiles:user_id (
          full_name,
          email,
          status
        )
      `)
      .eq('id', destinationAccountId)
      .single();

    if (destinationError) {
      if (destinationError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Recipient account not found.'
        });
      }

      throw destinationError;
    }

    // --------------------------------------------------------
    // RECIPIENT MUST STILL BE ACTIVE
    // --------------------------------------------------------

    if (destination.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Recipient account is ${destination.status} and cannot receive this transfer.`
      });
    }

    // --------------------------------------------------------
    // SOURCE ACCOUNT
    // --------------------------------------------------------

    const source = tx.accounts;

    if (!source) {
      return res.status(404).json({
        success: false,
        error: 'Source account not found.'
      });
    }

    // --------------------------------------------------------
    // APPROVAL DOES NOT MEAN IGNORE CURRENT BALANCE
    //
    // The account may have changed since the transfer was
    // initiated/reviewed.
    // --------------------------------------------------------

    const sourceBalance = Number(source.balance);
    const amount = Number(tx.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction amount.'
      });
    }

    if (sourceBalance < amount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Available: ${formatCurrency(sourceBalance)}, requested: ${formatCurrency(amount)}`
      });
    }

    // --------------------------------------------------------
    // SOURCE ACCOUNT MUST STILL BE RESTRICTED
    //
    // This is specifically the admin-review flow.
    // If the account has become active again, the transaction
    // should not be approved through this restricted flow.
    // --------------------------------------------------------

    const sourceAccountStatus =
      String(source.status || '').toLowerCase();

    const sourceProfileStatus =
      String(source.profiles?.status || '').toLowerCase();

    const stillRestricted =
      ['frozen', 'banned'].includes(sourceAccountStatus) ||
      ['frozen', 'banned'].includes(sourceProfileStatus);

    if (!stillRestricted) {
      return res.status(400).json({
        success: false,
        error:
          'The sender account is no longer restricted. This transaction cannot be approved as a restricted transfer.'
      });
    }

    // --------------------------------------------------------
    // CALCULATE NEW BALANCES
    // --------------------------------------------------------

    const newSourceBalance = sourceBalance - amount;
    const newDestinationBalance =
      Number(destination.balance) + amount;

    // --------------------------------------------------------
    // DEBIT SOURCE
    // --------------------------------------------------------

    const { error: debitError } = await supabase
      .from('accounts')
      .update({
        balance: newSourceBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', source.id)
      .eq('balance', source.balance);

    if (debitError) {
      throw debitError;
    }

    // --------------------------------------------------------
    // CREDIT DESTINATION
    // --------------------------------------------------------

    const { error: creditError } = await supabase
      .from('accounts')
      .update({
        balance: newDestinationBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', destination.id)
      .eq('balance', destination.balance);

    if (creditError) {
      // Roll back source debit
      await supabase
        .from('accounts')
        .update({
          balance: source.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', source.id);

      throw creditError;
    }

    // --------------------------------------------------------
    // MARK ORIGINAL TRANSACTION COMPLETED
    // --------------------------------------------------------

    const { data: completedTransaction, error: completeError } =
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          metadata: {
            ...metadata,
            adminApproved: true,
            approvedBy: req.user.id,
            approvedAt: new Date().toISOString(),
            balanceMoved: true
          }
        })
        .eq('id', tx.id)
        .eq('status', 'pending_review')
        .select()
        .single();

    if (completeError) {
      // Attempt to restore balances if transaction status update fails
      await supabase
        .from('accounts')
        .update({
          balance: source.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', source.id);

      await supabase
        .from('accounts')
        .update({
          balance: destination.balance,
          updated_at: new Date().toISOString()
        })
        .eq('id', destination.id);

      throw completeError;
    }

    // --------------------------------------------------------
    // CREATE RECIPIENT TRANSACTION
    //
    // reference_id MUST be unique.
    // Therefore do NOT reuse tx.reference_id.
    // --------------------------------------------------------

    const recipientReference =
      `${tx.reference_id}-CR`;

    const {
      data: recipientTransaction,
      error: recipientTransactionError
    } = await supabase
      .from('transactions')
      .insert([{
        account_id: destination.id,
        transaction_type: 'transfer',
        amount,
        description:
          tx.description || 'Same bank transfer',
        reference_id: recipientReference,
        counterparty_account: source.id,
        status: 'completed',
        metadata: {
          transferType: 'same_bank',
          originalReference: tx.reference_id,
          originalTransactionId: tx.id,
          fromAccountId: source.id,
          toAccountId: destination.id,
          senderName:
            source.profiles?.full_name || null,
          approvedBy: req.user.id,
          approvedAt: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (recipientTransactionError) {
      console.error(
        'Recipient transaction creation failed:',
        recipientTransactionError
      );

      // At this point money has already moved and the sender
      // transaction is completed. Do NOT throw a fake rollback
      // unless you implement a proper database transaction/RPC.
      //
      // Log it so the issue can be investigated.
    }

    // --------------------------------------------------------
    // NOTIFY SENDER
    // --------------------------------------------------------

    try {
      const notification = await createNotification({
        userId: source.user_id,
        title: 'Transfer Approved',
        message: `Your transfer of ${formatCurrency(amount)} has been approved and completed.`,
        type: 'transfer',
        reference: tx.reference_id
      });

      if (notification) {
        sendNotification(
          req.app.get('io'),
          source.user_id,
          notification
        );
      }
    } catch (notificationError) {
      console.error(
        'Approval notification error:',
        notificationError
      );
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,
      message: 'Transaction approved and completed successfully.',
      transaction: completedTransaction,
      from_account: {
        id: source.id,
        account_number: source.account_number,
        new_balance: newSourceBalance
      },
      to_account: {
        id: destination.id,
        account_number: destination.account_number,
        new_balance: newDestinationBalance
      }
    });

  } catch (error) {
    console.error('Approve Transaction Error:', error);
    next(error);
  }
};


// ============================================
// REJECT TRANSACTION
// ============================================

const rejectTransaction = async (req, res, next) => {
  try {
    const { txId } = req.params;

    // --------------------------------------------------------
    // GET TRANSACTION
    // --------------------------------------------------------

    const {
      data: transaction,
      error: getError
    } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          id,
          account_number,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        )
      `)
      .eq('id', txId)
      .single();

    if (getError) {
      if (getError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }

      throw getError;
    }

    // --------------------------------------------------------
    // ONLY PENDING REVIEW CAN BE REJECTED
    // --------------------------------------------------------

    if (transaction.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        error:
          `Only transactions pending review can be rejected. Current status: ${transaction.status}`
      });
    }

    // --------------------------------------------------------
    // REJECT
    //
    // No balance adjustment.
    // The money was never moved.
    // --------------------------------------------------------

    const {
      data: updated,
      error: updateError
    } = await supabase
      .from('transactions')
      .update({
        status: 'failed',
        metadata: {
          ...(transaction.metadata || {}),
          adminRejected: true,
          rejectedBy: req.user.id,
          rejectedAt: new Date().toISOString(),
          balanceMoved: false
        }
      })
      .eq('id', txId)
      .eq('status', 'pending_review')
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // --------------------------------------------------------
    // NOTIFY USER
    // --------------------------------------------------------

    try {
      const userId = transaction.accounts?.user_id;

      if (userId) {
        const notification = await createNotification({
          userId,
          title: 'Transfer Rejected',
          message:
            `Your transfer of ${formatCurrency(transaction.amount)} was rejected. No money was moved from your account.`,
          type: 'transfer',
          reference: transaction.reference_id
        });

        if (notification) {
          sendNotification(
            req.app.get('io'),
            userId,
            notification
          );
        }
      }
    } catch (notificationError) {
      console.error(
        'Rejection notification error:',
        notificationError
      );
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,
      message:
        'Transaction rejected successfully. No money was moved.',
      transaction: updated
    });

  } catch (error) {
    console.error('Reject Transaction Error:', error);
    next(error);
  }
};





// ============================================
// SYSTEM STATS
// ============================================

const getSystemStats = async (req, res, next) => {
  try {
    const { count: totalUsers, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (userError) throw userError;

    const { count: totalAccounts, error: accountError } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true });

    if (accountError) throw accountError;

    const { count: totalTransactions, error: txError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (txError) throw txError;

    const { count: pendingTransactions, error: pendingError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (pendingError) throw pendingError;

    const { data: volumeData, error: volumeError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('status', 'completed');

    if (volumeError) throw volumeError;

    const totalVolume = volumeData.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAccounts,
        totalTransactions,
        pendingTransactions,
        totalVolume
      }
    });
  } catch (error) {
    console.error('Get System Stats Error:', error);
    next(error);
  }
};

// ============================================
// HELPERS
// ============================================

// Create in-app notification
const createNotification = async ({ userId, title, message, type, reference }) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        reference_id: reference,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) {
      console.error('Notification insert error:', error);
      return null;
    }
    return data;
  } catch (e) {
    console.error('Notification error:', e);
    return null;
  }
};

// Generate reference
const generateReference = () => {
  return 'ADM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// ============================================
// ADMIN CREDIT / DEBIT
// ============================================

const adminCredit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { accountId, amount, description, date, sendAlert } = req.body;

    if (!accountId || !amount || amount <= 0 || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, amount (positive), description'
      });
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or does not belong to this user'
      });
    }

    const userEmail = account.profiles?.email;
    const userName = account.profiles?.full_name || 'User';

    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}. Cannot credit.`
      });
    }

    const amountNum = parseFloat(amount);
    const newBalance = parseFloat(account.balance) + amountNum;

    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    const reference = generateReference();
    const transactionData = {
      account_id: accountId,
      transaction_type: 'credit',
      amount: amountNum,
      description: description || 'Admin credit',
      reference_id: reference,
      status: 'completed',
      created_at: date || new Date().toISOString(),
    };

    try {
      transactionData.metadata = { admin_id: req.user.id, admin_note: 'Admin credit' };
    } catch (e) { /* ignore */ }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) throw txError;

    if (sendAlert) {
      try {
        const notification = await createNotification({
          userId: userId,
          title: 'Account Credited',
          message: `Your account ${account.account_number} has been credited with ${formatCurrency(amountNum)}. New balance: ${formatCurrency(newBalance)}.`,
          type: 'credit',
          reference: reference
        });

        if (notification) {
          sendNotification(req.app.get('io'), userId, notification);
        }

        if (userEmail) {
          const html = creditEmail({
            userName,
            accountNumber: account.account_number,
            amount: formatCurrency(amountNum),
            newBalance: formatCurrency(newBalance),
            description,
            reference,
          });

          await sendEmail({
            to: userEmail,
            subject: 'Account Credited',
            html,
          });
        }
      } catch (notifError) {
        console.error('Notification/Email error (non‑critical):', notifError);
      }
    }

    res.json({
      success: true,
      message: `Credited ${formatCurrency(amountNum)} to account ${account.account_number}`,
      transaction,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('Admin Credit Error:', error);
    next(error);
  }
};

const adminDebit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { accountId, amount, description, note, date, sendAlert } = req.body;

    if (!accountId || !amount || amount <= 0 || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: accountId, amount (positive), description'
      });
    }

    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (accountError || !account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or does not belong to this user'
      });
    }

    const userEmail = account.profiles?.email;
    const userName = account.profiles?.full_name || 'User';

    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}. Cannot debit.`
      });
    }

    const amountNum = parseFloat(amount);
    if (parseFloat(account.balance) < amountNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${formatCurrency(account.balance)}, requested: ${formatCurrency(amountNum)}`
      });
    }

    const newBalance = parseFloat(account.balance) - amountNum;

    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    const reference = generateReference();
    const transactionData = {
      account_id: accountId,
      transaction_type: 'debit',
      amount: amountNum,
      description: description || 'Admin debit',
      reference_id: reference,
      status: 'completed',
      created_at: date || new Date().toISOString(),
    };

    try {
      transactionData.metadata = { admin_id: req.user.id, admin_note: note || '' };
    } catch (e) { /* ignore */ }

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) throw txError;

    if (sendAlert) {
      try {
        const notification = await createNotification({
          userId: userId,
          title: 'Account Debited',
          message: `Your account ${account.account_number} has been debited with ${formatCurrency(amountNum)}. New balance: ${formatCurrency(newBalance)}. ${note ? `Note: ${note}` : ''}`,
          type: 'debit',
          reference: reference
        });

        if (notification) {
          sendNotification(req.app.get('io'), userId, notification);
        }

        if (userEmail) {
          const html = debitEmail({
            userName,
            accountNumber: account.account_number,
            amount: formatCurrency(amountNum),
            newBalance: formatCurrency(newBalance),
            description,
            note: note || '',
            reference,
          });

          await sendEmail({
            to: userEmail,
            subject: 'Account Debited',
            html,
          });
        }
      } catch (notifError) {
        console.error('Notification/Email error (non‑critical):', notifError);
      }
    }

    res.json({
      success: true,
      message: `Debited ${formatCurrency(amountNum)} from account ${account.account_number}`,
      transaction,
      new_balance: newBalance
    });

  } catch (error) {
    console.error('Admin Debit Error:', error);
    next(error);
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // User management
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  // Account management
  getAllAccounts,
		getAccountById,
  updateAccountStatus,
  // Transaction management
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  approveTransaction,
  rejectTransaction,
  // System stats
  getSystemStats,
  adminCredit,
  adminDebit,
};