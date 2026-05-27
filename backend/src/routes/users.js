/**
 * User Routes
 * Handles user profile operations
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * @route   GET /api/v1/users/search
 * @desc    Search users by username or email
 * @access  Private
 */
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url, status, last_seen_at')
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .neq('id', req.userId)
    .limit(20);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }

  res.json({
    success: true,
    data: { users }
  });
}));

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url, status, last_seen_at, bio, created_at')
    .eq('id', req.params.id)
    .single();

  if (error || !user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', protect, [
  body('display_name').optional().isLength({ max: 100 }).trim(),
  body('bio').optional().isLength({ max: 500 }).trim()
], asyncHandler(async (req, res) => {
  const { display_name, bio, avatar_url } = req.body;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      display_name,
      bio,
      avatar_url,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.userId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update profile'
    });
  }

  res.json({
    success: true,
    message: 'Profile updated',
    data: { user }
  });
}));

/**
 * @route   PUT /api/v1/users/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/settings', protect, asyncHandler(async (req, res) => {
  const { settings } = req.body;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ settings, updated_at: new Date().toISOString() })
    .eq('id', req.userId)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update settings'
    });
  }

  res.json({
    success: true,
    message: 'Settings updated',
    data: { settings: user.settings }
  });
}));

/**
 * @route   PUT /api/v1/users/status
 * @desc    Update user online status
 * @access  Private
 */
router.put('/status', protect, [
  body('status').isIn(['online', 'offline', 'away', 'busy'])
], asyncHandler(async (req, res) => {
  const { status } = req.body;

  await supabaseAdmin
    .from('users')
    .update({ status, last_seen_at: new Date().toISOString() })
    .eq('id', req.userId);

  res.json({
    success: true,
    message: 'Status updated'
  });
}));

/**
 * @route   GET /api/v1/users/contacts
 * @desc    Get user contacts (friends and recent conversations)
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  // Get friends
  const { data: friends } = await supabaseAdmin
    .from('friends')
    .select(`
      id,
      status,
      friend:users!friend_id(id, username, display_name, avatar_url, status, last_seen_at)
    `)
    .eq('user_id', req.userId)
    .eq('status', 'accepted');

  // Get direct message conversations
  const { data: conversations } = await supabaseAdmin
    .from('conversations')
    .select(`
      id,
      type,
      name,
      avatar_url,
      last_message_at,
      members:conversation_members(
        user_id,
        user:users(id, username, display_name, avatar_url, status)
      )
    `)
    .eq('type', 'direct')
    .contains('member_ids', [req.userId])
    .order('last_message_at', { ascending: false })
    .limit(10);

  res.json({
    success: true,
    data: { friends, conversations }
  });
}));

module.exports = router;