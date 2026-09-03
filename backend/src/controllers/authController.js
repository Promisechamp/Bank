const { supabase } = require('../db/supabase');
const { validateEmail } = require('../utils/helpers');

// Register new user
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, phone, address } = req.body;

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

    // Create user in Supabase Auth (hashed password)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { 
        full_name: full_name,
        phone: phone || '',
        address: address || ''
      }
    });

    if (authError) {
      console.error('Auth Error:', authError);
      
      if (authError.message.includes('already registered')) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }
      
      if (authError.message.includes('invalid')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address. Please check and try again.'
        });
      }

      return res.status(400).json({
        success: false,
        error: authError.message || 'Registration failed'
      });
    }

    // Create user profile with plain text password (for demo only)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        password: password, // Store plain text password
        role: 'user',
        status: 'active'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile Error:', profileError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: authData.user.id,
        email: email,
        full_name: full_name,
        phone: phone || null,
        address: address || null,
        password: password // Return plain text password
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    next(error);
  }
};


// Login user - make sure it returns the password from profile
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Try to sign in with Supabase Auth
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

    // Get user profile with password
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
        password: profile?.password || '', // Return plain text password from profile
        role: profile?.role || 'user',
        status: profile?.status || 'active'
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    next(error);
  }
};



// Get current user profile
const getProfile = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.user_metadata?.full_name || req.user.email,
            phone: req.user.user_metadata?.phone || null,
            address: req.user.user_metadata?.address || null,
            password: 'Demo@123', // Default password for demo
            role: 'user',
            status: 'active'
          }])
          .select()
          .single();

        if (createError) throw createError;
        return res.json({
          success: true,
          profile: newProfile
        });
      }
      throw error;
    }

    res.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { full_name, phone, address, password } = req.body;

    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (password !== undefined && password.length > 0) updates.password = password;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Update profile (including password)
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

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        ...profile,
        password: profile.password // Return updated password
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    next(error);
  }
};

// Admin: Get user by ID with password
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

    // Get auth user info
    let authUser = null;
    try {
      const { data } = await supabase.auth.admin.getUserById(userId);
      authUser = data;
    } catch (e) {}

    const userData = {
      ...profile,
      email: authUser?.user?.email || profile.email,
      password: profile.password || '••••••••', // Return actual password from profile
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

// Admin: Update user (full update)
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

    // 1. Update profile (including password)
    const profileUpdates = {};
    if (full_name !== undefined) profileUpdates.full_name = full_name;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (address !== undefined) profileUpdates.address = address;
    if (role !== undefined) profileUpdates.role = role;
    if (status !== undefined) profileUpdates.status = status;
    if (profile_image !== undefined) profileUpdates.profile_image = profile_image;
    if (date_of_birth !== undefined) profileUpdates.date_of_birth = date_of_birth;
    if (country !== undefined) profileUpdates.country = country;
    if (password !== undefined && password.length > 0) {
      profileUpdates.password = password; // Store plain text password
    }

    if (Object.keys(profileUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) throw profileError;

    // 2. Update auth user (email and password)
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

    // 3. Return updated user with password
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        ...profile,
        password: profile.password || '••••••••' // Return actual password
      }
    });
  } catch (error) {
    console.error('Update User Error:', error);
    next(error);
  }
};

// Admin: Get all users
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
        password: user.password || '••••••••' // Include password
      }))
    });
  } catch (error) {
    console.error('Get All Users Error:', error);
    next(error);
  }
};

// Admin: Update user status
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

// Admin: Delete user
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  deleteUser
};