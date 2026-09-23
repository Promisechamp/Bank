const { supabase } = require('../db/supabase');
const { formatCurrency } = require('../utils/helpers');
const { createAndSendNotification } = require('../utils/notifications');
const crypto = require('crypto');

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

    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        password: user.password || '••••••••'
      }))
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

// ============================================
// ADMIN: UPDATE USER (atomic update - both succeed or both fail)
// ============================================
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
      country,
						created_at
    } = req.body;

    let profileUpdates = {};
    let authUpdates = {};
    let hasProfileUpdate = false;
    let hasAuthUpdate = false;

    // Profile-only fields
    if (address !== undefined) { profileUpdates.address = address; hasProfileUpdate = true; }
    if (role !== undefined) { profileUpdates.role = role; hasProfileUpdate = true; }
    if (status !== undefined) { profileUpdates.status = status; hasProfileUpdate = true; }
    if (country !== undefined) { profileUpdates.country = country; hasProfileUpdate = true; }
    if (profile_image !== undefined) { 
      profileUpdates.profile_image = profile_image; 
      hasProfileUpdate = true; 
    }
    
    // ✅ Convert empty date_of_birth to null
    if (date_of_birth !== undefined) {
      profileUpdates.date_of_birth = date_of_birth === '' ? null : date_of_birth;
      hasProfileUpdate = true;
    }

    // Fields that need to be synced with auth metadata
    let metadataUpdates = {};
    if (full_name !== undefined) {
      profileUpdates.full_name = full_name;
      metadataUpdates.full_name = full_name;
      hasProfileUpdate = true;
    }
    if (phone !== undefined) {
      profileUpdates.phone = phone;
      metadataUpdates.phone = phone;
      hasProfileUpdate = true;
    }
    if (profile_image !== undefined) {
      metadataUpdates.profile_image = profile_image;
    }

    // Password: update both auth and profile
    if (password !== undefined && password !== null && password.length > 0) {
      profileUpdates.password = password;
      authUpdates.password = password;
      hasProfileUpdate = true;
      hasAuthUpdate = true;
    }

    // Email: update both auth and profile
    if (email !== undefined && email !== null && email.length > 0) {
      authUpdates.email = email;
      profileUpdates.email = email;
      hasAuthUpdate = true;
      hasProfileUpdate = true;
    }
				
				// ✅ ADD created_at to profile updates
					if (created_at !== undefined) {
							profileUpdates.created_at = created_at;
							metadataUpdates.created_at = created_at;
							hasProfileUpdate = true;
					}

    // If we have metadata updates
    if (Object.keys(metadataUpdates).length > 0) {
      const { data: currentAuth, error: fetchAuthError } = await supabase.auth.admin.getUserById(userId);
      if (fetchAuthError) {
        console.error('❌ Failed to fetch current auth user:', fetchAuthError);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch current user metadata'
        });
      }
      const currentMetadata = currentAuth?.user?.raw_user_meta_data || {};
      const mergedMetadata = { ...currentMetadata, ...metadataUpdates };
      authUpdates.user_metadata = mergedMetadata;
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

    // STEP 2: Update Profile (with rollback if fails)
    if (hasProfileUpdate) {
      try {
        console.log('📝 Updating profile...');
        
        // ✅ Fetch current user profile to get old avatar URL
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('profile_image')
          .eq('id', userId)
          .single();

        if (fetchError) {
          console.error('Fetch current profile error:', fetchError);
        }
        
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
                if (originalProfile && originalProfile.email) {
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

        // ✅ Delete old avatar from storage if profile_image was updated
        // Inside the updateUser function, after fetching currentProfile:

// ✅ Delete old avatar FIRST before updating
if (profile_image !== undefined && currentProfile?.profile_image) {
  try {
    const oldUrl = currentProfile.profile_image;
    // Extract the path after "avatars/" in the URL
    const match = oldUrl.match(/\/object\/public\/avatars\/(.+)$/);
    if (match) {
      const oldFilePath = match[1];
      console.log('🗑️ Deleting old avatar:', oldFilePath);
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([oldFilePath]);
      if (deleteError) {
        console.warn('⚠️ Failed to delete old avatar:', deleteError);
      } else {
        console.log('✅ Old avatar deleted successfully');
      }
    } else {
      console.warn('⚠️ Could not extract path from URL:', oldUrl);
    }
  } catch (deleteErr) {
    console.warn('⚠️ Error deleting old avatar:', deleteErr);
  }
}

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
              if (originalProfile && originalProfile.email) {
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
      last_sign_in: authUserInfo?.user?.last_sign_in_at || null,
      raw_user_meta_data: authUserInfo?.user?.raw_user_meta_data || {}
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




// ============================================
// ADMIN: DELETE USER (with avatar cleanup)
// ============================================
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // ✅ 1. Fetch user's profile to get avatar URL
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_image')
      .eq('id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch profile error:', fetchError);
    }

    // ✅ 2. Delete avatar from storage if it exists
    if (profile?.profile_image) {
      try {
        const oldUrl = profile.profile_image;
        const match = oldUrl.match(/\/object\/public\/avatars\/(.+)$/);
        const filePath = match ? match[1] : null;
        if (filePath) {
          console.log('🗑️ Deleting avatar for user:', filePath);
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([filePath]);
          if (deleteError) {
            console.warn('⚠️ Failed to delete avatar:', deleteError);
          } else {
            console.log('✅ Avatar deleted successfully');
          }
        }
      } catch (deleteErr) {
        console.warn('⚠️ Error deleting avatar:', deleteErr);
      }
    }

    // ✅ 3. Delete all user's notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (notifError) {
      console.warn('⚠️ Failed to delete notifications:', notifError);
    }

    // ✅ 4. Get all account IDs for this user
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId);
    if (accountsError) {
      console.warn('⚠️ Failed to fetch accounts:', accountsError);
    }

    if (accounts && accounts.length > 0) {
      const accountIds = accounts.map(a => a.id);
      
      // ✅ 5. Delete all transactions for these accounts
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .in('account_id', accountIds);
      if (txError) {
        console.warn('⚠️ Failed to delete transactions:', txError);
      }

      // ✅ 6. Delete all user's accounts
      const { error: accDeleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId);
      if (accDeleteError) {
        console.warn('⚠️ Failed to delete accounts:', accDeleteError);
      }
    }

    // ✅ 7. Delete the user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    if (profileError) {
      console.warn('⚠️ Failed to delete profile:', profileError);
    }

    // ✅ 8. Finally, delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
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

const getAllTransactions = async (req, res, next) => {
  try {
    const {
      limit = 100,
      offset = 0,
      status,
      accountId
    } = req.query;

    const parsedLimit =
      Math.min(
        Math.max(
          parseInt(limit, 10) || 100,
          1
        ),
        100
      );

    const parsedOffset =
      Math.max(
        parseInt(offset, 10) || 0,
        0
      );

    // ========================================================
    // TRANSACTIONS
    // ========================================================

    let query = supabase
      .from('transactions')
      .select(`
        *,
        sender_account:account_id (
          id,
          account_number,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        ),
        receiver_account:counterparty_account (
          id,
          account_number,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .range(
        parsedOffset,
        parsedOffset + parsedLimit - 1
      );

    // ========================================================
    // STATUS FILTER
    // ========================================================

    if (
      status &&
      status !== 'all'
    ) {
      query = query.eq(
        'status',
        status
      );
    }

    // ========================================================
    // ACCOUNT FILTER
    //
    // Match both:
    // account_id            = sender
    // counterparty_account  = receiver
    // ========================================================

    if (accountId) {
      query = query.or(
        `account_id.eq.${accountId},counterparty_account.eq.${accountId}`
      );
    }

    const {
      data: transactions,
      error
    } = await query;

    if (error) {
      throw error;
    }

    // ========================================================
    // ADD DIRECTION
    // ========================================================

    const formattedTransactions =
      (transactions || []).map(
        (transaction) => {

          let direction = 'unknown';

          if (accountId) {
            if (
              String(transaction.account_id) ===
              String(accountId)
            ) {
              direction = 'sent';
            } else if (
              String(transaction.counterparty_account) ===
              String(accountId)
            ) {
              direction = 'received';
            }
          }

          return {
            ...transaction,
            direction
          };
        }
      );

    // ========================================================
    // COUNT
    // ========================================================

    let countQuery = supabase
      .from('transactions')
      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      );

    if (
      status &&
      status !== 'all'
    ) {
      countQuery = countQuery.eq(
        'status',
        status
      );
    }

    if (accountId) {
      countQuery = countQuery.or(
        `account_id.eq.${accountId},counterparty_account.eq.${accountId}`
      );
    }

    const {
      count,
      error: countError
    } = await countQuery;

    if (countError) {
      throw countError;
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      success: true,

      transactions:
        formattedTransactions,

      pagination: {
        total:
          count || 0,

        limit:
          parsedLimit,

        offset:
          parsedOffset
      }
    });

  } catch (error) {
    console.error(
      'Get All Transactions Error:',
      error
    );

    next(error);
  }
};





const getTransactionById = async (
  req,
  res,
  next
) => {
  try {
    const {
      txId
    } = req.params;

    // ========================================================
    // AUTHENTICATION
    // ========================================================

    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    // ========================================================
    // GET TRANSACTION
    // ========================================================

    const {
      data: transaction,
      error
    } = await supabase
      .from('transactions')
      .select(`
        *,
        sender_account:account_id (
          id,
          account_number,
          account_type,
          balance,
          currency,
          status,
          user_id,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        ),
        receiver_account:counterparty_account (
          id,
          account_number,
          account_type,
          balance,
          currency,
          status,
          user_id,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        )
      `)
      .eq(
        'id',
        txId
      )
      .single();

    // ========================================================
    // NOT FOUND
    // ========================================================

    if (error) {
      if (
        error.code === 'PGRST116'
      ) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found.'
        });
      }

      throw error;
    }

    // ========================================================
    // VERIFY USER OWNS ONE SIDE OF THE TRANSACTION
    // ========================================================

    const senderUserId =
      transaction.sender_account?.user_id;

    const receiverUserId =
      transaction.receiver_account?.user_id;

    if (
      senderUserId !== req.user.id &&
      receiverUserId !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error:
          'You are not authorized to view this transaction.'
      });
    }

    // ========================================================
    // DETERMINE DIRECTION
    // ========================================================

    let direction = 'unknown';

    if (
      senderUserId === req.user.id
    ) {
      direction = 'sent';
    } else if (
      receiverUserId === req.user.id
    ) {
      direction = 'received';
    }

    // ========================================================
    // RESPONSE
    // ========================================================

    return res.json({
      success: true,

      transaction: {
        ...transaction,

        direction,

        sender: {
          accountId:
            transaction.sender_account?.id || null,

          accountNumber:
            transaction.sender_account?.account_number || null,

          name:
            transaction.sender_account?.profiles?.full_name ||
            null,

          email:
            transaction.sender_account?.profiles?.email ||
            null,

          phone:
            transaction.sender_account?.profiles?.phone ||
            null
        },

        receiver: {
          accountId:
            transaction.receiver_account?.id || null,

          accountNumber:
            transaction.receiver_account?.account_number || null,

          name:
            transaction.receiver_account?.profiles?.full_name ||
            null,

          email:
            transaction.receiver_account?.profiles?.email ||
            null,

          phone:
            transaction.receiver_account?.profiles?.phone ||
            null
        }
      }
    });

  } catch (error) {
    console.error(
      'Get Transaction By ID Error:',
      error
    );

    next(error);
  }
};










// ============================================
// UPDATE TRANSACTION (full — no type restrictions)
// ============================================
const updateTransaction = async (req, res, next) => {
  try {
    const { txId } = req.params;
    const {
      amount,
      description,
      date,
      status,
      transaction_type,
      reference_id,
      metadata,
      counterparty_account,
      balance_after,
      currency,
      fee,
      category,
      channel,
      payment_method,
    } = req.body;

    // ---------------------------------------------------------
    // FETCH EXISTING
    // ---------------------------------------------------------
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
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }
      throw fetchError;
    }

    const account = existing.accounts;
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Associated account not found',
      });
    }

    // ---------------------------------------------------------
    // BUILD UPDATES
    // ---------------------------------------------------------
    const updates = {};
    let newBalance = account.balance;
    let balanceUpdated = false;

    // ---- Amount (allowed for ALL transaction types) ----
    if (amount !== undefined && amount !== null) {
      const newAmount = parseFloat(amount);
      if (isNaN(newAmount) || newAmount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Amount must be a positive number',
        });
      }

      const oldAmount = parseFloat(existing.amount);
      const diff = newAmount - oldAmount;

      const type = transaction_type || existing.transaction_type;

      // ✅ Recalculate balance for every type — no restrictions
      if (type === 'credit') {
        newBalance = parseFloat(account.balance) + diff;
      } else if (type === 'debit') {
        newBalance = parseFloat(account.balance) - diff;
        if (newBalance < 0) {
          return res.status(400).json({
            success: false,
            error: `Insufficient balance. Available: ${formatCurrency(
              account.balance
            )}, resulting balance would be negative.`,
          });
        }
      } else {
        // transfer / reversal / anything else — treat as a debit-style
        // adjustment on the source account
        newBalance = parseFloat(account.balance) - diff;
        if (newBalance < 0) {
          return res.status(400).json({
            success: false,
            error: `Insufficient balance for this adjustment. Available: ${formatCurrency(
              account.balance
            )}.`,
          });
        }
      }

      updates.amount = newAmount;
      balanceUpdated = true;
    }

    // ---- All other editable columns (unrestricted) ----
    if (description !== undefined) updates.description = description;
    if (date !== undefined) updates.created_at = date;
    if (status !== undefined) updates.status = status;
    if (transaction_type !== undefined) updates.transaction_type = transaction_type;
    if (reference_id !== undefined) updates.reference_id = reference_id;
    if (metadata !== undefined) updates.metadata = metadata;
    if (counterparty_account !== undefined) updates.counterparty_account = counterparty_account;
    if (balance_after !== undefined) updates.balance_after = balance_after;
    if (currency !== undefined) updates.currency = currency;
    if (fee !== undefined) updates.fee = fee;
    if (category !== undefined) updates.category = category;
    if (channel !== undefined) updates.channel = channel;
    if (payment_method !== undefined) updates.payment_method = payment_method;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    // ---------------------------------------------------------
    // APPLY BALANCE CHANGE FIRST (with rollback guard on tx update)
    // ---------------------------------------------------------
    if (balanceUpdated) {
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);

      if (balanceError) {
        console.error('Balance update error:', balanceError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update account balance',
        });
      }
    }

    // ---------------------------------------------------------
    // UPDATE TRANSACTION
    // ---------------------------------------------------------
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
      // Roll back balance if we moved it
      if (balanceUpdated) {
        await supabase
          .from('accounts')
          .update({
            balance: account.balance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }

      console.error('Transaction update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update transaction',
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated,
      new_balance: balanceUpdated ? newBalance : account.balance,
    });
  } catch (error) {
    console.error('Update Transaction Error:', error);
    next(error);
  }
};



// ============================================
// DELETE SINGLE TRANSACTION
// ============================================
const deleteTransaction = async (req, res, next) => {
  try {
    const { txId } = req.params;
    const { reverseBalance } = req.query; // ?reverseBalance=true

    // --------------------------------------------------------
    // FETCH TRANSACTION
    // --------------------------------------------------------
    const { data: tx, error: fetchError } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts:account_id (
          id,
          account_number,
          balance,
          user_id
        )
      `)
      .eq('id', txId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      throw fetchError;
    }

    const account = tx.accounts;
    const shouldReverse = reverseBalance === 'true';

    // --------------------------------------------------------
    // OPTIONAL: REVERSE BALANCE
    // --------------------------------------------------------
    if (shouldReverse && account && tx.status === 'completed') {
      const amount = parseFloat(tx.amount);
      let revertedBalance = parseFloat(account.balance);

      if (tx.transaction_type === 'credit') {
        revertedBalance = parseFloat(account.balance) - amount;
        if (revertedBalance < 0) {
          return res.status(400).json({
            success: false,
            error: `Cannot reverse: resulting balance would be negative (${formatCurrency(revertedBalance)}).`
          });
        }
      } else if (tx.transaction_type === 'debit') {
        revertedBalance = parseFloat(account.balance) + amount;
      } else {
        // transfer / others → treat as credit reversal
        revertedBalance = parseFloat(account.balance) - amount;
      }

      const { error: balanceError } = await supabase
        .from('accounts')
        .update({
          balance: revertedBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);

      if (balanceError) {
        console.error('Balance reversal error:', balanceError);
        return res.status(500).json({
          success: false,
          error: 'Failed to reverse account balance'
        });
      }

      console.log(`✅ Balance reversed for tx ${txId}. New balance: ${revertedBalance}`);
    }

    // --------------------------------------------------------
    // DELETE TRANSACTION
    // --------------------------------------------------------
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId);

    if (deleteError) {
      console.error('Delete transaction error:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete transaction'
      });
    }

    return res.json({
      success: true,
      message: shouldReverse
        ? 'Transaction deleted and balance reversed successfully'
        : 'Transaction deleted successfully',
      deleted_id: txId,
      balance_reversed: shouldReverse && tx.status === 'completed'
    });

  } catch (error) {
    console.error('Delete Transaction Error:', error);
    next(error);
  }
};

// ============================================
// DELETE ALL TRANSACTIONS (with optional filters)
// ============================================
const deleteAllTransactions = async (req, res, next) => {
  try {
    const { status, accountId, confirm } = req.query;

    // --------------------------------------------------------
    // SAFETY GUARD — require explicit confirmation
    // --------------------------------------------------------
    if (confirm !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Confirmation required. Add ?confirm=true to proceed with deleting all transactions.'
      });
    }

    // --------------------------------------------------------
    // COUNT MATCHING FIRST (for response info)
    // --------------------------------------------------------
    let countQuery = supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (accountId) {
      countQuery = countQuery.or(
        `account_id.eq.${accountId},counterparty_account.eq.${accountId}`
      );
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    if (!count || count === 0) {
      return res.json({
        success: true,
        message: 'No transactions matched the criteria',
        deleted_count: 0
      });
    }

    // --------------------------------------------------------
    // BUILD DELETE QUERY
    // --------------------------------------------------------
    let deleteQuery = supabase
      .from('transactions')
      .delete();

    if (status && status !== 'all') {
      deleteQuery = deleteQuery.eq('status', status);
    }

    if (accountId) {
      deleteQuery = deleteQuery.or(
        `account_id.eq.${accountId},counterparty_account.eq.${accountId}`
      );
    } else {
      // Supabase requires a filter for delete — use neq to match all real rows
      deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('Delete all transactions error:', deleteError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete transactions'
      });
    }

    console.log(`✅ Deleted ${count} transaction(s)`);

    return res.json({
      success: true,
      message: `${count} transaction(s) deleted successfully`,
      deleted_count: count,
      filters: {
        status: status || 'all',
        accountId: accountId || null
      }
    });

  } catch (error) {
    console.error('Delete All Transactions Error:', error);
    next(error);
  }
};




// ============================================
// APPROVE TRANSACTION (UPDATED)
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
    // --------------------------------------------------------

    const destinationAccountId = tx.counterparty_account || metadata.toAccountId;

    if (!destinationAccountId) {
      return res.status(400).json({
        success: false,
        error: 'Recipient account information is missing from this transaction.'
      });
    }

    if (destinationAccountId === tx.account_id) {
      return res.status(400).json({
        success: false,
        error: 'Source and recipient accounts cannot be the same.'
      });
    }

    // --------------------------------------------------------
    // GET DESTINATION
    // --------------------------------------------------------

    const { data: destination, error: destinationError } = await supabase
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
    // ✅ CHECK: Source account is restricted OR active
    // --------------------------------------------------------
    const sourceAccountStatus = String(source.status || '').toLowerCase();
    const sourceProfileStatus = String(source.profiles?.status || '').toLowerCase();

    const isRestricted =
      ['frozen', 'banned'].includes(sourceAccountStatus) ||
      ['frozen', 'banned'].includes(sourceProfileStatus);

    // ✅ If NOT restricted, we still allow approval (account was unfrozen)
    // ✅ If restricted, we proceed with the restricted transfer flow
    // ✅ Either way, we approve

    // --------------------------------------------------------
    // CALCULATE NEW BALANCES
    // --------------------------------------------------------

    const newSourceBalance = sourceBalance - amount;
    const newDestinationBalance = Number(destination.balance) + amount;

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

    const { data: completedTransaction, error: completeError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        metadata: {
          ...metadata,
          adminApproved: true,
          approvedBy: req.user.id,
          approvedAt: new Date().toISOString(),
          balanceMoved: true,
          wasRestricted: isRestricted // ✅ Track if this was a restricted transfer
        }
      })
      .eq('id', tx.id)
      .eq('status', 'pending_review')
      .select()
      .single();

    if (completeError) {
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
    // --------------------------------------------------------

    const recipientReference = `${tx.reference_id}-CR`;

    const { data: recipientTransaction, error: recipientTransactionError } = await supabase
      .from('transactions')
      .insert([{
        account_id: destination.id,
        transaction_type: 'transfer',
        amount,
        description: tx.description || 'Same bank transfer',
        reference_id: recipientReference,
        counterparty_account: source.id,
        status: 'completed',
        metadata: {
          transferType: 'same_bank',
          originalReference: tx.reference_id,
          originalTransactionId: tx.id,
          fromAccountId: source.id,
          toAccountId: destination.id,
          senderName: source.profiles?.full_name || null,
          approvedBy: req.user.id,
          approvedAt: new Date().toISOString()
        }
      }])
      .select()
      .single();

    if (recipientTransactionError) {
      console.error('Recipient transaction creation failed:', recipientTransactionError);
    }

    // --------------------------------------------------------
    // NOTIFICATIONS & EMAILS
    // --------------------------------------------------------

    const io = req.app.get('io');

    try {
      const senderName = source.profiles?.full_name || 'User';
      const recipientName = destination.profiles?.full_name || 'recipient';

      await createAndSendNotification(
        io,
        source.user_id,
        'transfer',
        'Transfer Approved',
        `Your transfer of ${formatCurrency(amount)} has been approved and completed.`,
        tx.reference_id,
        {
          userName: senderName,
          fromAccount: source.account_number,
          toAccount: destination.account_number,
          amount: formatCurrency(amount),
          newBalance: formatCurrency(newSourceBalance),
          description: tx.description || 'Same bank transfer',
          reference: tx.reference_id
        }
      );
    } catch (notifError) {
      console.error('Sender notification error:', notifError);
    }

    try {
      const senderName = source.profiles?.full_name || 'User';
      const recipientName = destination.profiles?.full_name || 'User';

      await createAndSendNotification(
        io,
        destination.user_id,
        'transfer',
        'Transfer Received',
        `You received ${formatCurrency(amount)} from ${senderName}.`,
        tx.reference_id,
        {
          userName: recipientName,
          fromAccount: source.account_number,
          toAccount: destination.account_number,
          amount: formatCurrency(amount),
          newBalance: formatCurrency(newDestinationBalance),
          description: `Transfer from ${senderName}`,
          reference: tx.reference_id
        }
      );
    } catch (notifError) {
      console.error('Recipient notification error:', notifError);
    }

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.json({
      success: true,
      message: isRestricted 
        ? 'Transaction approved and completed successfully (restricted transfer).'
        : 'Transaction approved and completed successfully.',
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

    const { data: transaction, error: getError } = await supabase
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

    if (transaction.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        error: `Only transactions pending review can be rejected. Current status: ${transaction.status}`
      });
    }

    const { data: updated, error: updateError } = await supabase
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

    const userId = transaction.accounts?.user_id;
    if (userId) {
      const io = req.app.get('io');
      const userName = transaction.accounts?.profiles?.full_name || 'User';

      try {
        await createAndSendNotification(
          io,
          userId,
          'system',
          'Transfer Rejected',
          `Your transfer of ${formatCurrency(transaction.amount)} was rejected. No money was moved from your account.`,
          transaction.reference_id,
          {
            template: 'transfer_rejected',
            userName,
            amount: formatCurrency(transaction.amount),
            reference: transaction.reference_id
          }
        );
      } catch (notifError) {
        console.error('Rejection notification error:', notifError);
      }
    }

    return res.json({
      success: true,
      message: 'Transaction rejected successfully. No money was moved.',
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
      .eq('status', 'pending_review');

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
// LAYOUT STATS (for admin sidebar badges)
// ============================================
const layoutStats = async (req, res, next) => {
  try {
    const adminId = req.user.id;

    // 1. Get unread chat messages count for admin
    const { count: unreadChats, error: chatError } = await supabase
      .from('chat_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gt('admin_unread_count', 0);

    if (chatError) {
      console.error('Chat unread count error:', chatError);
    }

    // 2. Get card order counts (all orders)
    const { count: cardOrders, error: cardError } = await supabase
      .from('track_card')
      .select('id', { count: 'exact', head: true });

    if (cardError) {
      console.error('Card order count error:', cardError);
    }

    // 3. Get pending review transactions count
    const { count: pendingTransactions, error: txError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    if (txError) {
      console.error('Pending transactions count error:', txError);
    }

    res.json({
      success: true,
      stats: {
        unreadChats: unreadChats || 0,
        cardOrders: cardOrders || 0,
        pendingTransactions: pendingTransactions || 0,
      }
    });

  } catch (error) {
    console.error('Layout Stats Error:', error);
    next(error);
  }
};



// ============================================
// HELPERS
// ============================================
const generateReference = () => {
  return 'ADM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
};

// ============================================
// ADMIN CREDIT / DEBIT
// ============================================
// ============================================
// ADMIN CREDIT
// ============================================
// ============================================
// ADMIN CREDIT
// ============================================
const adminCredit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      accountId,
      amount,
      description,
      date,
      sendAlert,

      // Sender metadata (top-level, kept for compatibility)
      senderName,
      senderBank,
      senderAccountNo,

      // ✅ Accept full metadata object from frontend
      metadata: incomingMetadata,
    } = req.body;

    if (!accountId || !amount || amount <= 0 || !description) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: accountId, amount (positive), description',
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
        error:
          'Account not found or does not belong to this user',
      });
    }

    const userName = account.profiles?.full_name || 'User';

    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}. Cannot credit.`,
      });
    }

    const amountNum = parseFloat(amount);
    const newBalance = parseFloat(account.balance) + amountNum;

    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    // ---------------------------------------------------------
    // BUILD FULL METADATA
    //
    // For a CREDIT, the credited account IS the recipient.
    // We persist BOTH generic keys (accountType / swiftCode /
    // routingNumber) and recipient-prefixed keys so the receipt
    // and history endpoints find them regardless of which key
    // style they read.
    //
    // Fallback chain for each value:
    //   frontend metadata  →  top-level body  →  account row
    // ---------------------------------------------------------
    const safeIncomingMetadata =
      incomingMetadata && typeof incomingMetadata === 'object'
        ? incomingMetadata
        : {};

    const resolvedAccountType =
      safeIncomingMetadata.accountType ??
      safeIncomingMetadata.account_type ??
      safeIncomingMetadata.recipientAccountType ??
      account.account_type ??
      null;

    const resolvedSwiftCode =
      safeIncomingMetadata.swiftCode ??
      safeIncomingMetadata.swift_code ??
      safeIncomingMetadata.recipientSwiftCode ??
      account.swift_code ??
      null;

    const resolvedRoutingNumber =
      safeIncomingMetadata.routingNumber ??
      safeIncomingMetadata.routing_number ??
      safeIncomingMetadata.recipientRoutingNumber ??
      account.routing_number ??
      null;

    const resolvedAccountNumber =
      safeIncomingMetadata.accountNumber ??
      safeIncomingMetadata.account_number ??
      account.account_number ??
      null;

    const finalMetadata = {
      ...safeIncomingMetadata,

      // Sender side
      senderName:
        safeIncomingMetadata.senderName ?? senderName ?? null,
      senderBank:
        safeIncomingMetadata.senderBank ?? senderBank ?? null,
      senderAccountNo:
        safeIncomingMetadata.senderAccountNo ?? senderAccountNo ?? null,

      // ✅ Generic destination account keys (existing behavior)
      accountId: account.id,
      accountNumber: resolvedAccountNumber,
      accountType: resolvedAccountType,
      swiftCode: resolvedSwiftCode,
      routingNumber: resolvedRoutingNumber,
      currency: safeIncomingMetadata.currency ?? account.currency ?? null,
      accountStatus:
        safeIncomingMetadata.accountStatus ?? account.status ?? null,

      // ✅ Recipient-prefixed keys (what the receipt reads)
      recipientAccountId: account.id,
      recipientAccountNumber: resolvedAccountNumber,
      recipientAccountType: resolvedAccountType,
      recipientSwiftCode: resolvedSwiftCode,
      recipientRoutingNumber: resolvedRoutingNumber,

      // Recipient display fields (helpful for the receipt's party card)
      recipientName:
        safeIncomingMetadata.recipientName ?? userName ?? null,
      receiverName:
        safeIncomingMetadata.receiverName ?? userName ?? null,
      recipientBank:
        safeIncomingMetadata.recipientBank ??
        'Trusty credit union bank',

      // Receipt metadata
      paymentMethod:
        safeIncomingMetadata.paymentMethod ?? null,
      channel:
        safeIncomingMetadata.channel ?? null,

      // Direction — this is a credit
      direction: 'credit',

      description:
        safeIncomingMetadata.description ?? description ?? null,
    };

    const reference = generateReference();

    const transactionData = {
      account_id: accountId,
      transaction_type: 'credit',
      amount: amountNum,
      description: description || 'Admin credit',
      reference_id: reference,
      status: 'completed',
      created_at: date || new Date().toISOString(),
      metadata: finalMetadata,
    };

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) throw txError;

    if (sendAlert) {
      const io = req.app.get('io');

      Promise.resolve()
        .then(() =>
          createAndSendNotification(
            io,
            userId,
            'credit',
            'Account Credited',
            `Your account ${account.account_number} has been credited with ${formatCurrency(
              amountNum
            )}. New balance: ${formatCurrency(newBalance)}.`,
            reference,
            {
              userName,
              accountNumber: account.account_number,
              amount: formatCurrency(amountNum),
              newBalance: formatCurrency(newBalance),
              description: description || 'Credit transaction',
              reference,
            }
          )
        )
        .catch((notifError) => {
          console.error(
            'Background notification/email failed:',
            notifError
          );
        });
    }

    res.json({
      success: true,
      message: `Credited ${formatCurrency(amountNum)} to account ${
        account.account_number
      }`,
      transaction,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Admin Credit Error:', error);
    next(error);
  }
};


// ============================================
// ADMIN DEBIT
// ============================================
const adminDebit = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const {
      accountId,
      amount,
      description,
      note,
      date,
      sendAlert,

      // Receiver metadata (top-level, kept for compatibility)
      receiverAccountNo,
      receiverName,
      receiverBank,

      // ✅ Accept full metadata object from frontend
      metadata: incomingMetadata,
    } = req.body;

    if (!accountId || !amount || amount <= 0 || !description) {
      return res.status(400).json({
        success: false,
        error:
          'Missing required fields: accountId, amount (positive), description',
      });
    }

    if (!receiverName || !receiverAccountNo || !receiverBank) {
      return res.status(400).json({
        success: false,
        error:
          'Missing receiver information: receiverName, receiverAccountNo, and receiverBank are required',
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
        error:
          'Account not found or does not belong to this user',
      });
    }

    const userName = account.profiles?.full_name || 'User';

    if (account.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Account is ${account.status}. Cannot debit.`,
      });
    }

    const amountNum = parseFloat(amount);
    if (parseFloat(account.balance) < amountNum) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${formatCurrency(
          account.balance
        )}, requested: ${formatCurrency(amountNum)}`,
      });
    }

    const newBalance = parseFloat(account.balance) - amountNum;

    const { data: updatedAccount, error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .select()
      .single();

    if (updateError) throw updateError;

    // ---------------------------------------------------------
    // BUILD FULL METADATA
    //
    // For a DEBIT, the debited account is the SENDER. The
    // recipient info comes from the frontend.
    // ---------------------------------------------------------
    const safeIncomingMetadata =
      incomingMetadata && typeof incomingMetadata === 'object'
        ? incomingMetadata
        : {};

    const resolvedRecipientAccountType =
      safeIncomingMetadata.recipientAccountType ??
      safeIncomingMetadata.recipient_account_type ??
      safeIncomingMetadata.accountType ??
      safeIncomingMetadata.account_type ??
      null;

    const resolvedRecipientSwiftCode =
      safeIncomingMetadata.recipientSwiftCode ??
      safeIncomingMetadata.recipient_swift_code ??
      safeIncomingMetadata.swiftCode ??
      safeIncomingMetadata.swift_code ??
      null;

    const resolvedRecipientRoutingNumber =
      safeIncomingMetadata.recipientRoutingNumber ??
      safeIncomingMetadata.recipient_routing_number ??
      safeIncomingMetadata.routingNumber ??
      safeIncomingMetadata.routing_number ??
      null;

    const finalMetadata = {
      ...safeIncomingMetadata,

      // Receiver side (top-level)
      receiverAccountNo:
        safeIncomingMetadata.receiverAccountNo ??
        receiverAccountNo ??
        null,
      receiverName:
        safeIncomingMetadata.receiverName ?? receiverName ?? null,
      receiverBank:
        safeIncomingMetadata.receiverBank ?? receiverBank ?? null,

      // ✅ Recipient-prefixed keys (what the receipt reads)
      recipientName:
        safeIncomingMetadata.recipientName ??
        receiverName ??
        null,
      recipientAccountNumber:
        safeIncomingMetadata.recipientAccountNumber ??
        safeIncomingMetadata.recipientAccountNo ??
        receiverAccountNo ??
        null,
      recipientAccountType: resolvedRecipientAccountType,
      recipientSwiftCode: resolvedRecipientSwiftCode,
      recipientRoutingNumber: resolvedRecipientRoutingNumber,

      // ✅ Generic keys (existing behavior)
      accountType: resolvedRecipientAccountType,
      swiftCode: resolvedRecipientSwiftCode,
      routingNumber: resolvedRecipientRoutingNumber,

      // Sender side = the debited account
      senderName:
        safeIncomingMetadata.senderName ?? userName ?? null,
      senderAccountNumber:
        safeIncomingMetadata.senderAccountNumber ??
        account.account_number ??
        null,
      senderBank:
        safeIncomingMetadata.senderBank ??
        'Trusty credit union bank',

      // Receipt metadata
      paymentMethod:
        safeIncomingMetadata.paymentMethod ?? null,
      channel:
        safeIncomingMetadata.channel ?? null,

      admin_note:
        safeIncomingMetadata.admin_note ?? note ?? '',

      // Direction — this is a debit
      direction: 'debit',

      description:
        safeIncomingMetadata.description ?? description ?? null,
    };

    const reference = generateReference();

    const transactionData = {
      account_id: accountId,
      transaction_type: 'debit',
      amount: amountNum,
      description: description || 'Debit transaction',
      reference_id: reference,
      status: 'completed',
      created_at: date || new Date().toISOString(),
      metadata: finalMetadata,
    };

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (txError) throw txError;

    if (sendAlert) {
      const io = req.app.get('io');

      Promise.resolve()
        .then(() =>
          createAndSendNotification(
            io,
            userId,
            'debit',
            'Account Debited',
            `Your account ${
              account.account_number
            } has been debited with ${formatCurrency(
              amountNum
            )}. New balance: ${formatCurrency(newBalance)}.${
              note ? ` Note: ${note}` : ''
            }`,
            reference,
            {
              userName,
              accountNumber: account.account_number,
              amount: formatCurrency(amountNum),
              newBalance: formatCurrency(newBalance),
              description: description || 'Debit transaction',
              note: note || '',
              reference,
            }
          )
        )
        .catch((notifError) => {
          console.error(
            'Background notification/email failed:',
            notifError
          );
        });
    }

    res.json({
      success: true,
      message: `Debited ${formatCurrency(amountNum)} from account ${
        account.account_number
      }`,
      transaction,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Admin Debit Error:', error);
    next(error);
  }
};







// ============================================
// REGISTRATION TOKEN MANAGEMENT
// ============================================
const generateRegisterToken = async (req, res) => {
  try {
    const { expiresAt } = req.body;
    let expiryDate;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid expiry date' });
      }
    } else {
      expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const token = crypto.randomUUID();
    await supabase.from('register_token').insert({
      token,
      expires_at: expiryDate.toISOString(),
      created_by: req.user.id,
    });

    res.json({ success: true, token, expiresAt: expiryDate.toISOString() });
  } catch (error) {
    console.error('Generate Token Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getRegisterTokens = async (req, res) => {
  try {
    const { data: tokens, error } = await supabase
      .from('register_token')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, tokens });
  } catch (error) {
    console.error('Get Tokens Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const revokeRegisterToken = async (req, res) => {
  try {
    const { token } = req.params;
    const { error } = await supabase
      .from('register_token')
      .delete()
      .eq('token', token);

    if (error) throw error;
    res.json({ success: true, message: 'Token permanently deleted' });
  } catch (error) {
    console.error('Delete Token Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// EXPORTS
// ============================================
module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
  getAllAccounts,
  getAccountById,
  updateAccountStatus,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
		deleteTransaction,
		deleteAllTransactions,
  approveTransaction,
  rejectTransaction,
  getSystemStats,
		layoutStats,
  adminCredit,
  adminDebit,
  generateRegisterToken,
  getRegisterTokens,
  revokeRegisterToken
};