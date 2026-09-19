const { supabase } = require('../db/supabase');
const { validateEmail, generateAccountNumber, constants } = require('../utils/helpers');
const { createAndSendNotification } = require('../utils/notifications');
const { newUserRegistrationAdminEmail } = require('../email/templates');
const crypto = require("crypto");

// ============================================
// REGISTER (admin creates user – account optional)
// ============================================
const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      address,
      country,
      profile_image,
      date_of_birth,
      create_account = false,
      account_type = 'checking'
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format. Please enter a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        phone: phone || '',
        address: address || '',
        country: country || '',
        profile_image: profile_image || '',
        date_of_birth: date_of_birth || ''
      }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
      if (authError.message.includes('invalid')) {
        return res.status(400).json({ success: false, error: 'Invalid email address. Please check and try again.' });
      }
      return res.status(400).json({ success: false, error: authError.message || 'Registration failed' });
    }

    // ✅ Convert empty date_of_birth to null
    const dateOfBirth = date_of_birth === '' ? null : date_of_birth;

    // Create user profile (including profile_image)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        country: country || null,
        profile_image: profile_image || null,
        date_of_birth: dateOfBirth,
        password: password,
        role: 'user',
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile Error:', profileError);
      // Continue – we still want to send notifications
    }

    // ------------------------------------------------------------------
    // OPTIONAL: CREATE ACCOUNT IF REQUESTED
    // ------------------------------------------------------------------
    let account = null;
    if (create_account) {
      let finalAccountType = account_type;
      if (!constants.ACCOUNT_TYPES.includes(finalAccountType)) {
        finalAccountType = 'checking';
      }

      const accountNumber = generateAccountNumber();
      const { data: newAccount, error: accError } = await supabase
        .from('accounts')
        .insert([{
          user_id: authData.user.id,
          account_number: accountNumber,
          account_type: finalAccountType,
          currency: constants.CURRENCY || 'USD',
          balance: 0,
          status: 'active'
        }])
        .select()
        .single();

      if (accError) {
        console.error('Account creation error:', accError);
      } else {
        account = newAccount;
        const io = req.app.get('io');
        await createAndSendNotification(
          io,
          authData.user.id,
          'system',
          `Account Created – ${finalAccountType}`,
          `Your ${finalAccountType} account (${accountNumber}) has been created.`,
          account.id
        );
      }
    }

    // ------------------------------------------------------------------
    // SEND NOTIFICATIONS
    // ------------------------------------------------------------------
    const io = req.app.get('io');

    await createAndSendNotification(
      io,
      authData.user.id,
      'system',
      'Welcome to Trusty credit union banking!',
      'Your account has been created successfully. Start exploring.',
      null,
      {
        template: 'welcome',
        userName: full_name,
        accountNumber: account?.account_number || 'Login to your dashboard',
        accountType: account_type || 'Savings',
        balance: '0.00'
      }
    );

    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (!adminsError && admins && admins.length > 0) {
      const registrationDate = new Date().toLocaleString();
      for (const admin of admins) {
        await createAndSendNotification(
          io,
          admin.id,
          'system',
          'New User Registration',
          `${full_name} (${email}) has just registered.`,
          authData.user.id,
          {
            template: 'admin_new_user',
            adminName: admin.full_name || 'Admin',
            userName: full_name,
            userEmail: email,
            userPhone: phone || 'N/A',
            registrationDate: registrationDate
          }
        );
      }
    }

    res.status(201).json({
      success: true,
      message: create_account
        ? `User registered with a ${account_type} account`
        : 'User registered successfully',
      user: {
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        country: country || null,
        profile_image: profile_image || null,
        date_of_birth: dateOfBirth,
        password: password
      },
      account: account || null
    });

  } catch (error) {
    console.error('Registration Error:', error);
    next(error);
  }
};

// ============================================
// SELF REGISTER (public registration – account mandatory)
// ============================================
const selfRegister = async (req, res, next) => {
  try {
    const {
      email,
      password,
      full_name,
      phone,
      address,
      country,
      profile_image,
      date_of_birth,
      account_type = 'checking',
      register_token
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format. Please enter a valid email address.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
        phone: phone || '',
        address: address || '',
        country: country || '',
        profile_image: profile_image || '',
        date_of_birth: date_of_birth || ''
      }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      if (authError.message.includes('already registered')) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }
      if (authError.message.includes('invalid')) {
        return res.status(400).json({ success: false, error: 'Invalid email address. Please check and try again.' });
      }
      return res.status(400).json({ success: false, error: authError.message || 'Registration failed' });
    }

    // ✅ Convert empty date_of_birth to null
    const dateOfBirth = date_of_birth === '' ? null : date_of_birth;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        country: country || null,
        profile_image: profile_image || null,
        date_of_birth: dateOfBirth,
        password: password,
        role: 'user',
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile Error:', profileError);
    }

    let finalAccountType = account_type;
    if (!constants.ACCOUNT_TYPES.includes(finalAccountType)) {
      finalAccountType = 'checking';
    }

    const accountNumber = generateAccountNumber();
    const { data: account, error: accError } = await supabase
      .from('accounts')
      .insert([{
        user_id: authData.user.id,
        account_number: accountNumber,
        account_type: finalAccountType,
        currency: constants.CURRENCY || 'USD',
        balance: 0,
        status: 'active'
      }])
      .select()
      .single();

    if (accError) {
      console.error('Account creation error:', accError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({
        success: false,
        error: 'Failed to create account. Please try again.'
      });
    }

    const io = req.app.get('io');
    await createAndSendNotification(
      io,
      authData.user.id,
      'system',
      `Account Created – ${finalAccountType}`,
      `Your ${finalAccountType} account (${accountNumber}) has been created.`,
      account.id
    );

    await createAndSendNotification(
      io,
      authData.user.id,
      'system',
      'Welcome to Trusty credit union banking!',
      'Your account has been created successfully. Start exploring.',
      null,
      {
        template: 'welcome',
        userName: full_name,
        accountNumber: account.account_number,
        accountType: finalAccountType,
        balance: '0.00'
      }
    );

    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (!adminsError && admins && admins.length > 0) {
      const registrationDate = new Date().toLocaleString();
      for (const admin of admins) {
        await createAndSendNotification(
          io,
          admin.id,
          'system',
          'New User Registration',
          `${full_name} (${email}) has just registered.`,
          authData.user.id,
          {
            template: 'admin_new_user',
            adminName: admin.full_name || 'Admin',
            userName: full_name,
            userEmail: email,
            userPhone: phone || 'N/A',
            registrationDate: registrationDate
          }
        );
      }
    }

    if (register_token) {
      const { error: tokenError } = await supabase
        .from('register_token')
        .update({ used: true })
        .eq('token', register_token)
        .eq('used', false);

      if (tokenError) {
        console.error('Failed to mark token as used:', tokenError);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered with account',
      user: {
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        country: country || null,
        profile_image: profile_image || null,
        date_of_birth: dateOfBirth,
        password: password
      },
      account: account
    });

  } catch (error) {
    console.error('Self Registration Error:', error);
    next(error);
  }
};

// ============================================
// LOGIN
// ============================================
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Login Error:', error);
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
      }
      return res.status(401).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile Fetch Error:', profileError);
    }

    res.json({
      success: true,
      message: 'Login successful',
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name: profile?.full_name || data.user.user_metadata?.full_name || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        country: profile?.country || '',
        profile_image: profile?.profile_image || data.user.user_metadata?.profile_image || null,
        date_of_birth: profile?.date_of_birth || data.user.user_metadata?.date_of_birth || null,
        password: profile?.password || '',
								transfer_pin: profile?.transfer_pin || '',
        role: profile?.role || 'user',
        status: profile?.status || 'active'
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    next(error);
  }
};

// ============================================
// GET CURRENT USER PROFILE
// ============================================
const getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    next(error);
  }
};

// ============================================
// UPDATE USER PROFILE (with old avatar deletion)
// ============================================
// ============================================
// UPDATE USER PROFILE (with old avatar deletion)
// ============================================
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, address, country, password, profile_image, date_of_birth } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (country !== undefined) updates.country = country;
    if (profile_image !== undefined) updates.profile_image = profile_image;
    if (date_of_birth !== undefined) {
      updates.date_of_birth = date_of_birth === '' ? null : date_of_birth;
    }
    if (password !== undefined && password.length > 0) updates.password = password;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // ✅ Fetch current user profile to get old avatar URL
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_image')
      .eq('id', req.user.id)
      .single();

    if (fetchError) {
      console.error('Fetch current profile error:', fetchError);
    }

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

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Also update auth password if provided
    if (password && password.length > 0) {
      await supabase.auth.admin.updateUserById(req.user.id, { password });
    }

    // Optionally update auth user_metadata to keep in sync
    if (full_name || phone || address || country || profile_image || date_of_birth) {
      const metadataUpdates = {};
      if (full_name) metadataUpdates.full_name = full_name;
      if (phone) metadataUpdates.phone = phone;
      if (address) metadataUpdates.address = address;
      if (country) metadataUpdates.country = country;
      if (profile_image) metadataUpdates.profile_image = profile_image;
      if (date_of_birth) metadataUpdates.date_of_birth = date_of_birth === '' ? null : date_of_birth;
      await supabase.auth.admin.updateUserById(req.user.id, { user_metadata: metadataUpdates });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...profile,
        password: profile.password
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    next(error);
  }
};





// ============================================
// ADMIN: GET USER BY ID
// ============================================
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
      const { data } = await supabase.auth.admin.getUserById(userId);
      authUser = data;
    } catch (e) {}

    const userData = {
      ...profile,
      email: authUser?.user?.email || profile.email,
      password: profile.password || '••••••••',
      email_confirmed: authUser?.user?.email_confirmed_at ? true : false,
      last_sign_in: authUser?.user?.last_sign_in_at || null,
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
// ADMIN: UPDATE USER (full update)
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
						created_at,
    } = req.body;

    const profileUpdates = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (address !== undefined) profileUpdates.address = address;
    if (role !== undefined) profileUpdates.role = role;
    if (status !== undefined) profileUpdates.status = status;
    if (created_at !== undefined) profileUpdates.created_at = created_at;
    if (profile_image !== undefined) profileUpdates.profile_image = profile_image;
    
    // ✅ Convert empty date_of_birth to null
    if (date_of_birth !== undefined) {
      profileUpdates.date_of_birth = date_of_birth === '' ? null : date_of_birth;
    }
    
    if (country !== undefined) profileUpdates.country = country;
    if (password !== undefined && password.length > 0) {
      profileUpdates.password = password;
    }

    if (Object.keys(profileUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

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

    if (profileError) throw profileError;

    // ✅ Delete old avatar from storage if profile_image was updated
    if (profile_image !== undefined && currentProfile?.profile_image && currentProfile.profile_image !== profile_image) {
      try {
        const oldUrl = currentProfile.profile_image;
        const match = oldUrl.match(/\/object\/public\/avatars\/(.+)$/);
        const oldFilePath = match ? match[1] : null;
        if (oldFilePath) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldFilePath]);
          if (deleteError) {
            console.warn('⚠️ Failed to delete old avatar:', deleteError);
          } else {
            console.log('🗑️ Old avatar deleted successfully');
          }
        }
      } catch (deleteErr) {
        console.warn('⚠️ Error deleting old avatar:', deleteErr);
      }
    }

    const authUpdates = {};
    if (email !== undefined) authUpdates.email = email;
    if (password !== undefined && password.length > 0) authUpdates.password = password;

    if (Object.keys(authUpdates).length > 0) {
      try {
        await supabase.auth.admin.updateUserById(userId, authUpdates);
      } catch (e) {
        console.error('Auth Update Error:', e);
      }
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...profile,
        password: profile.password || '••••••••'
      }
    });
  } catch (error) {
    console.error('Update User Error:', error);
    next(error);
  }
};

// ============================================
// ADMIN: GET ALL USERS
// ============================================
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

// ============================================
// ADMIN: UPDATE USER STATUS
// ============================================
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



/**
 * Generate a random recovery phrase.
 *
 * Example:
 * DTI-A7F2-91BC-4E8D
 */
function generateRecoveryPhrase() {
  const random = crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();

  return `DTI-${random.slice(0, 4)}-${random.slice(4, 8)}-${random.slice(8, 12)}`;
}

/**
 * Validate a transfer PIN.
 */
function isValidTransferPin(pin) {
  return typeof pin === "string" && /^\d{4}$/.test(pin);
}

/**
 * Validate security questions.
 */
function isValidSecurityQuestions(questions) {
  if (!Array.isArray(questions) || questions.length < 2) {
    return false;
  }

  return questions.every(
    (item) =>
      item &&
      typeof item.question === "string" &&
      item.question.trim().length > 0 &&
      typeof item.answer === "string" &&
      item.answer.trim().length > 0
  );
};

/**
 * GET /auth/security
 *
 * Get the authenticated user's security settings.
 */
const getSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "transfer_pin, security_questions, account_recovery_phrase"
      )
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "Profile not found.",
        });
      }

      console.error("Get security settings error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve security settings.",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get security settings exception:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

/**
 * POST /auth/security
 *
 * Create security settings for the authenticated user.
 *
 * The recovery phrase is ALWAYS generated by the backend.
 */
const createSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      transfer_pin,
      security_questions,
    } = req.body;

    // Validate transfer PIN
    if (!isValidTransferPin(transfer_pin)) {
      return res.status(400).json({
        success: false,
        message: "Transfer PIN must contain exactly 4 digits.",
      });
    }

    // Validate security questions
    if (!isValidSecurityQuestions(security_questions)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide at least two complete security questions and answers.",
      });
    }

    // Prevent duplicate questions
    const questionNames = security_questions.map(
      (item) => item.question.trim().toLowerCase()
    );

    if (new Set(questionNames).size !== questionNames.length) {
      return res.status(400).json({
        success: false,
        message: "Security questions must be different.",
      });
    }

    // Check whether security settings already exist.
    const { data: existing, error: existingError } = await supabase
      .from("profiles")
      .select(
        "transfer_pin, security_questions, account_recovery_phrase"
      )
      .eq("id", userId)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      console.error(
        "Check existing security settings error:",
        existingError
      );

      return res.status(500).json({
        success: false,
        message: "Failed to check existing security settings.",
      });
    }

    if (
      existing?.transfer_pin ||
      existing?.account_recovery_phrase ||
      (Array.isArray(existing?.security_questions) &&
        existing.security_questions.length > 0)
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Security settings already exist. Use the update endpoint instead.",
      });
    }

    // Generate recovery phrase on the SERVER.
    const account_recovery_phrase = generateRecoveryPhrase();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        transfer_pin,
        security_questions,
        account_recovery_phrase,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select(
        "transfer_pin, security_questions, account_recovery_phrase"
      )
      .single();

    if (error) {
      console.error("Create security settings error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to create security settings.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Security settings created successfully.",
      data,
    });
  } catch (error) {
    console.error("Create security settings exception:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

/**
 * PUT /auth/security
 *
 * Update security settings.
 *
 * Supported:
 * - transfer_pin
 * - security_questions
 * - regenerate_recovery_phrase
 */
const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      transfer_pin,
      security_questions,
      regenerate_recovery_phrase,
    } = req.body;

    // Nothing supplied
    if (
      transfer_pin === undefined &&
      security_questions === undefined &&
      regenerate_recovery_phrase !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "No security settings were provided for update.",
      });
    }

    const updates = {};

    // Update PIN if supplied
    if (transfer_pin !== undefined) {
      if (!isValidTransferPin(transfer_pin)) {
        return res.status(400).json({
          success: false,
          message: "Transfer PIN must contain exactly 4 digits.",
        });
      }

      updates.transfer_pin = transfer_pin;
    }

    // Update security questions if supplied
    if (security_questions !== undefined) {
      if (!isValidSecurityQuestions(security_questions)) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide at least two complete security questions and answers.",
        });
      }

      const questionNames = security_questions.map(
        (item) => item.question.trim().toLowerCase()
      );

      if (new Set(questionNames).size !== questionNames.length) {
        return res.status(400).json({
          success: false,
          message: "Security questions must be different.",
        });
      }

      updates.security_questions = security_questions;
    }

    // Generate a completely new recovery phrase when requested.
    if (regenerate_recovery_phrase === true) {
      updates.account_recovery_phrase =
        generateRecoveryPhrase();
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select(
        "transfer_pin, security_questions, account_recovery_phrase"
      )
      .single();

    if (error) {
      console.error("Update security settings error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to update security settings.",
      });
    }

    let message = "Security settings updated successfully.";

    if (regenerate_recovery_phrase === true) {
      message = "A new recovery phrase has been generated.";
    }

    return res.status(200).json({
      success: true,
      message,
      data,
    });
  } catch (error) {
    console.error("Update security settings exception:", error);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};









const verifyTransferPin = async (req, res, next) => {
  try {
    const { transfer_pin } = req.body;

    if (!/^\d{4}$/.test(transfer_pin || '')) {
      return res.status(400).json({
        success: false,
        message: 'Transfer PIN must be 4 digits.',
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('transfer_pin')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    if (!profile?.transfer_pin) {
      return res.status(400).json({
        success: false,
        message: 'No transfer PIN configured.',
      });
    }

    const success = transfer_pin === profile.transfer_pin;

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect transfer PIN.',
      });
    }

    return res.json({
      success: true,
      message: 'PIN verified.',
    });
  } catch (error) {
    console.error('Verify Transfer PIN Error:', error);
    next(error);
  }
};





module.exports = {
  register,
  selfRegister,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser,
		
		getSecuritySettings,
  createSecuritySettings,
  updateSecuritySettings,
		verifyTransferPin,
};