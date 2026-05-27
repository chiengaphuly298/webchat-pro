/**
 * Authentication Routes
 * Handles user registration, login, and session management
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect, generateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { supabaseAdmin, createSupabaseClient } = require('../utils/supabase');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('password').isLength({ min: 6 }),
  body('display_name').optional().isLength({ max: 100 }).trim()
], asyncHandler(async (req, res) => {
  const { email, username, password, display_name } = req.body;

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, display_name }
  });

  if (authError) {
    return res.status(400).json({
      success: false,
      message: authError.message
    });
  }

  const userId = authData.user.id;

  // Create user profile - use upsert to handle potential duplicate
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: userId,
      email,
      username,
      display_name: display_name || username,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    })
    .select()
    .single();

  if (userError) {
    console.error('User profile creation error:', userError);
    // Try to rollback auth user but don't fail if it doesn't work
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.error('Rollback failed:', e);
    }
    return res.status(400).json({
      success: false,
      message: 'Failed to create user profile: ' + userError.message
    });
  }

  // Generate JWT
  const token = generateToken(userId);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      token
    }
  });
}));

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Login with Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Get user profile
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  // Update online status
  await supabaseAdmin
    .from('users')
    .update({ status: 'online', last_seen_at: new Date().toISOString() })
    .eq('id', authData.user.id);

  const token = generateToken(authData.user.id);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      token
    }
  });
}));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, asyncHandler(async (req, res) => {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.userId)
    .single();

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, asyncHandler(async (req, res) => {
  // Update offline status
  await supabaseAdmin
    .from('users')
    .update({ status: 'offline' })
    .eq('id', req.userId);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

/**
 * @route   POST /api/v1/auth/google
 * @desc    Login/Register with Google
 * @access  Public
 */
router.post('/google', authLimiter, asyncHandler(async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({
      success: false,
      message: 'Google ID token required'
    });
  }

  // Verify with Supabase
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithIdToken({
    provider: 'google',
    token: id_token
  });

  if (authError) {
    return res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }

  // Check if user exists, create if not
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  let user = existingUser;

  if (!existingUser) {
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        username: authData.user.email.split('@')[0],
        display_name: authData.user.full_name || authData.user.email.split('@')[0],
        avatar_url: authData.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authData.user.email}`
      })
      .select()
      .single();
    user = newUser;
  }

  const token = generateToken(authData.user.id);

  res.json({
    success: true,
    message: 'Google login successful',
    data: { user, token }
  });
}));

/**
 * @route   POST /api/v1/auth/github
 * @desc    Login/Register with GitHub
 * @access  Public
 */
router.post('/github', authLimiter, asyncHandler(async (req, res) => {
  const { id_token, access_token } = req.body;

  // Sign in with GitHub via Supabase
  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithIdToken({
    provider: 'github',
    token: id_token
  });

  if (authError) {
    return res.status(401).json({
      success: false,
      message: 'GitHub authentication failed'
    });
  }

  // Check/create user profile
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  let user = existingUser;

  if (!existingUser) {
    const { data: newUser } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        username: authData.user.email.split('@')[0],
        display_name: authData.user.user_metadata?.full_name || authData.user.email.split('@')[0],
        avatar_url: authData.user.avatar_url
      })
      .select()
      .single();
    user = newUser;
  }

  const token = generateToken(authData.user.id);

  res.json({
    success: true,
    message: 'GitHub login successful',
    data: { user, token }
  });
}));

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail()
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CLIENT_URL}/reset-password`
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to send reset email'
    });
  }

  res.json({
    success: true,
    message: 'Password reset email sent'
  });
}));

/**
 * @route   PUT /api/v1/auth/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', protect, [
  body('current_password').exists(),
  body('new_password').isLength({ min: 6 })
], asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  // Update password via Supabase
  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.userId, {
    password: new_password
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update password'
    });
  }

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

module.exports = router;