/**
 * Notification Routes
 * Handles user notifications
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  const { limit = 50, unread_only = false } = req.query;

  let query = supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit));

  if (unread_only === 'true') {
    query = query.eq('is_read', false);
  }

  const { data: notifications, error } = await query;

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }

  res.json({
    success: true,
    data: { notifications }
  });
}));

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  res.json({
    success: true,
    message: 'Marked as read'
  });
}));

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', protect, asyncHandler(async (req, res) => {
  await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', req.userId)
    .eq('is_read', false);

  res.json({
    success: true,
    message: 'All marked as read'
  });
}));

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId);

  res.json({
    success: true,
    message: 'Notification deleted'
  });
}));

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread-count', protect, asyncHandler(async (req, res) => {
  const { count } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact' })
    .eq('user_id', req.userId)
    .eq('is_read', false);

  res.json({
    success: true,
    data: { count }
  });
}));

module.exports = router;