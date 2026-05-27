/**
 * Friends Routes
 * Handles friend requests and relationships
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * @route   GET /api/v1/friends
 * @desc    Get all friends
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status = 'accepted' } = req.query;

  // Query both where user is sender and where user is receiver
  const { data: friends, error } = await supabaseAdmin
    .from('friends')
    .select(`
      id,
      status,
      created_at,
      user_id,
      friend_id,
      user:users!user_id(
        id, username, display_name, avatar_url, status, last_seen_at
      ),
      friend:users!friend_id(
        id, username, display_name, avatar_url, status, last_seen_at
      )
    `)
    .or(`user_id.eq.${req.userId},friend_id.eq.${req.userId}`)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch friends'
    });
  }

  res.json({
    success: true,
    data: { friends }
  });
}));

/**
 * @route   GET /api/v1/friends/requests
 * @desc    Get pending friend requests
 * @access  Private
 */
router.get('/requests', protect, asyncHandler(async (req, res) => {
  const { data: incoming } = await supabaseAdmin
    .from('friends')
    .select(`
      id,
      status,
      created_at,
      user:users!user_id(
        id, username, display_name, avatar_url
      )
    `)
    .eq('friend_id', req.userId)
    .eq('status', 'pending');

  const { data: outgoing } = await supabaseAdmin
    .from('friends')
    .select(`
      id,
      status,
      created_at,
      friend:users!friend_id(
        id, username, display_name, avatar_url
      )
    `)
    .eq('user_id', req.userId)
    .eq('status', 'pending');

  res.json({
    success: true,
    data: {
      incoming: incoming || [],
      outgoing: outgoing || []
    }
  });
}));

/**
 * @route   POST /api/v1/friends/request
 * @desc    Send friend request
 * @access  Private
 */
router.post('/request', protect, [
  body('user_id').isUUID()
], asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  if (user_id === req.userId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot add yourself as friend'
    });
  }

  // Check if user exists
  const { data: targetUser, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', user_id)
    .single();

  if (userError || !targetUser) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Check if already friends or pending
  const { data: existing } = await supabaseAdmin
    .from('friends')
    .select('id, status')
    .or(`(user_id.eq.${req.userId},friend_id.eq.${user_id}),(user_id.eq.${user_id},friend_id.eq.${req.userId})`)
    .single();

  if (existing) {
    if (existing.status === 'accepted') {
      return res.status(409).json({
        success: false,
        message: 'Already friends'
      });
    }
    if (existing.status === 'pending') {
      return res.status(409).json({
        success: false,
        message: 'Friend request already pending'
      });
    }
  }

  const { data: friendship, error } = await supabaseAdmin
    .from('friends')
    .insert({
      user_id: req.userId,
      friend_id: user_id,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }

  res.status(201).json({
    success: true,
    data: { friendship }
  });
}));

/**
 * @route   PUT /api/v1/friends/request/:id/accept
 * @desc    Accept friend request
 * @access  Private
 */
router.put('/request/:id/accept', protect, asyncHandler(async (req, res) => {
  // Verify request exists and targets current user
  const { data: request } = await supabaseAdmin
    .from('friends')
    .select('id, user_id, friend_id')
    .eq('id', req.params.id)
    .eq('friend_id', req.userId)
    .eq('status', 'pending')
    .single();

  if (!request) {
    return res.status(404).json({
      success: false,
      message: 'Friend request not found'
    });
  }

  const { error } = await supabaseAdmin
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', req.params.id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to accept request'
    });
  }

  // Get current user info for notification
  const { data: currentUser } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url')
    .eq('id', req.userId)
    .single();

  // Send socket notification to the request sender
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${request.user_id}`).emit('friend_accepted', {
      user: currentUser,
      message: `${currentUser.display_name || currentUser.username} accepted your friend request`
    });
  }

  res.json({
    success: true,
    message: 'Friend request accepted'
  });
}));

/**
 * @route   PUT /api/v1/friends/request/:id/decline
 * @desc    Decline friend request
 * @access  Private
 */
router.put('/request/:id/decline', protect, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('friends')
    .delete()
    .eq('id', req.params.id)
    .eq('friend_id', req.userId)
    .eq('status', 'pending');

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to decline request'
    });
  }

  res.json({
    success: true,
    message: 'Friend request declined'
  });
}));

/**
 * @route   DELETE /api/v1/friends/:id
 * @desc    Remove friend
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const { error } = await supabaseAdmin
    .from('friends')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove friend'
    });
  }

  res.json({
    success: true,
    message: 'Friend removed'
  });
}));

/**
 * @route   PUT /api/v1/friends/block/:id
 * @desc    Block user
 * @access  Private
 */
router.put('/block/:id', protect, [
  body('block').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const { block = true } = req.body;

  if (block) {
    // Block - update existing or create block relationship
    const { data: existing } = await supabaseAdmin
      .from('friends')
      .select('id')
      .or(`(user_id.eq.${req.userId},friend_id.eq.${req.params.id}),(user_id.eq.${req.params.id},friend_id.eq.${req.userId})`)
      .single();

    if (existing) {
      await supabaseAdmin
        .from('friends')
        .update({ status: 'blocked' })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin
        .from('friends')
        .insert({
          user_id: req.userId,
          friend_id: req.params.id,
          status: 'blocked'
        });
    }
  } else {
    // Unblock
    await supabaseAdmin
      .from('friends')
      .delete()
      .eq('user_id', req.userId)
      .eq('friend_id', req.params.id)
      .eq('status', 'blocked');
  }

  res.json({
    success: true,
    message: block ? 'User blocked' : 'User unblocked'
  });
}));

module.exports = router;