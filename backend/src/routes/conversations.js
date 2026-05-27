/**
 * Conversation Routes
 * Handles direct and group chat conversations
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { supabaseAdmin } = require('../utils/supabase');

/**
 * @route   GET /api/v1/conversations
 * @desc    Get all conversations for user
 * @access  Private
 */
router.get('/', protect, asyncHandler(async (req, res) => {
  // Get all conversations user is member of
  const { data: memberships } = await supabaseAdmin
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', req.userId);

  const conversationIds = memberships?.map(m => m.conversation_id) || [];

  if (conversationIds.length === 0) {
    return res.json({
      success: true,
      data: { conversations: [] }
    });
  }

  const { data: conversations, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        user_id,
        role,
        nickname,
        is_pinned,
        unread_count,
        user:users(id, username, display_name, avatar_url, status)
      ),
      last_message:messages(id, content, sender_id, created_at, type)
    `)
    .in('id', conversationIds)
    .order('last_message_at', { ascending: false });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }

  res.json({
    success: true,
    data: { conversations }
  });
}));

/**
 * @route   POST /api/v1/conversations/direct
 * @desc    Create or get direct conversation with user
 * @access  Private
 */
router.post('/direct', protect, [
  body('user_id').isUUID()
], asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  if (user_id === req.userId) {
    return res.status(400).json({
      success: false,
      message: 'Cannot create conversation with yourself'
    });
  }

  // Check if recipient exists
  const { data: recipient, error: userError } = await supabaseAdmin
    .from('users')
    .select('id, username, display_name, avatar_url, status')
    .eq('id', user_id)
    .single();

  if (userError || !recipient) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find existing direct conversation - check via conversation_members
  const { data: existingConv } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('type', 'direct')
    .single();

  // Filter manually since we can't use contains on non-existent column
  if (existingConv) {
    const memberCheck = await supabaseAdmin
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', existingConv.id);

    const memberIds = memberCheck.data?.map(m => m.user_id) || [];
    if (memberIds.includes(req.userId) && memberIds.includes(user_id) && memberIds.length === 2) {
      return res.json({
        success: true,
        data: { conversation: existingConv, created: false }
      });
    }
  }

  // Create new conversation
  const { data: conversation, error: convError } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'direct',
      creator_id: req.userId
    })
    .select()
    .single();

  if (convError) {
    console.error('Conversation insert error:', convError);
    return res.status(500).json({
      success: false,
      message: 'Failed to create conversation'
    });
  }

  // Add members
  await supabaseAdmin.from('conversation_members').insert([
    { conversation_id: conversation.id, user_id: req.userId, role: 'member' },
    { conversation_id: conversation.id, user_id: user_id, role: 'member' }
  ]);

  conversation.members = [
    { user_id: req.userId, role: 'member', user: req.user },
    { user_id: user_id, role: 'member', user: recipient }
  ];

  res.status(201).json({
    success: true,
    data: { conversation, created: true }
  });
}));

/**
 * @route   POST /api/v1/conversations/group
 * @desc    Create group conversation
 * @access  Private
 */
router.post('/group', protect, [
  body('name').isLength({ min: 1, max: 100 }).trim(),
  body('member_ids').isArray({ min: 2 }),
  body('member_ids.*').isUUID(),
  body('avatar_url').optional().isURL()
], asyncHandler(async (req, res) => {
  console.log('Create group request:', { name: req.body.name, member_ids: req.body.member_ids, userId: req.userId });
  const { name, member_ids, avatar_url } = req.body;

  // Ensure creator is included
  const allMemberIds = [...new Set([req.userId, ...member_ids])];

  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .insert({
      type: 'group',
      name,
      avatar_url: avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      creator_id: req.userId
    })
    .select()
    .single();

  if (error) {
    console.error('Create group error:', JSON.stringify(error, null, 2));
    return res.status(500).json({
      success: false,
      message: 'Failed to create group: ' + error.message,
      details: error.details,
      hint: error.hint
    });
  }

  console.log('Created group:', conversation);

  // Add members with creator as admin
  const memberInserts = allMemberIds.map(userId => ({
    conversation_id: conversation.id,
    user_id: userId,
    role: userId === req.userId ? 'admin' : 'member'
  }));

  await supabaseAdmin.from('conversation_members').insert(memberInserts);

  // Fetch full conversation with members
  const { data: fullConversation } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        user_id,
        role,
        nickname,
        user:users(id, username, display_name, avatar_url, status)
      )
    `)
    .eq('id', conversation.id)
    .single();

  res.status(201).json({
    success: true,
    data: { conversation: fullConversation }
  });
}));

/**
 * @route   GET /api/v1/conversations/:id
 * @desc    Get conversation by ID
 * @access  Private
 */
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .select(`
      *,
      members:conversation_members(
        user_id,
        role,
        nickname,
        is_pinned,
        unread_count,
        user:users(id, username, display_name, avatar_url, status)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  // Verify user is member
  const isMember = conversation.members?.some(m => m.user_id === req.userId);

  if (!isMember) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.json({
    success: true,
    data: { conversation }
  });
}));

/**
 * @route   PUT /api/v1/conversations/:id
 * @desc    Update conversation (name, avatar)
 * @access  Private
 */
router.put('/:id', protect, [
  body('name').optional().isLength({ min: 1, max: 100 }).trim(),
  body('avatar_url').optional().isURL()
], asyncHandler(async (req, res) => {
  const { name, avatar_url } = req.body;

  // Verify admin/creator
  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('creator_id, type')
    .eq('id', req.params.id)
    .single();

  if (!conv) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  if (conv.type === 'group' && conv.creator_id !== req.userId) {
    return res.status(403).json({
      success: false,
      message: 'Only creator can update group'
    });
  }

  const { data: conversation, error } = await supabaseAdmin
    .from('conversations')
    .update({ name, avatar_url })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update conversation'
    });
  }

  res.json({
    success: true,
    data: { conversation }
  });
}));

/**
 * @route   POST /api/v1/conversations/:id/leave
 * @desc    Leave group conversation
 * @access  Private
 */
router.post('/:id/leave', protect, asyncHandler(async (req, res) => {
  // Verify conversation exists and is group
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('id, type')
    .eq('id', req.params.id)
    .single();

  if (!conversation) {
    return res.status(404).json({
      success: false,
      message: 'Conversation not found'
    });
  }

  if (conversation.type !== 'group') {
    return res.status(400).json({
      success: false,
      message: 'Can only leave group conversations'
    });
  }

  // Remove user from conversation
  const { error } = await supabaseAdmin
    .from('conversation_members')
    .delete()
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.userId);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }

  res.json({
    success: true,
    message: 'Left group successfully'
  });
}));

/**
 * @route   DELETE /api/v1/conversations/:id
 * @desc    Leave/delete conversation
 * @access  Private
 */
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  // Remove user from conversation
  const { error } = await supabaseAdmin
    .from('conversation_members')
    .delete()
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.userId);

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to leave conversation'
    });
  }

  res.json({
    success: true,
    message: 'Left conversation successfully'
  });
}));

/**
 * @route   POST /api/v1/conversations/:id/members
 * @desc    Add member to group
 * @access  Private
 */
router.post('/:id/members', protect, [
  body('user_id').isUUID()
], asyncHandler(async (req, res) => {
  const { user_id } = req.body;

  // Verify user is admin
  const { data: membership } = await supabaseAdmin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  if (!membership || !['admin', 'moderator'].includes(membership.role)) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can add members'
    });
  }

  // Add member
  const { error } = await supabaseAdmin
    .from('conversation_members')
    .insert({
      conversation_id: req.params.id,
      user_id,
      role: 'member'
    });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add member'
    });
  }

  res.status(201).json({
    success: true,
    message: 'Member added'
  });
}));

/**
 * @route   DELETE /api/v1/conversations/:id/members/:userId
 * @desc    Remove member from group
 * @access  Private
 */
router.delete('/:id/members/:userId', protect, asyncHandler(async (req, res) => {
  // Verify user is admin or removing self
  const { data: membership } = await supabaseAdmin
    .from('conversation_members')
    .select('role')
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.userId)
    .single();

  const isSelf = req.params.userId === req.userId;
  const isAdmin = membership?.role === 'admin';

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can remove other members'
    });
  }

  await supabaseAdmin
    .from('conversation_members')
    .delete()
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.params.userId);

  res.json({
    success: true,
    message: 'Member removed'
  });
}));

/**
 * @route   PUT /api/v1/conversations/:id/read
 * @desc    Mark conversation as read
 * @access  Private
 */
router.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await supabaseAdmin
    .from('conversation_members')
    .update({
      unread_count: 0,
      last_read_at: new Date().toISOString()
    })
    .eq('conversation_id', req.params.id)
    .eq('user_id', req.userId);

  res.json({
    success: true,
    message: 'Marked as read'
  });
}));

module.exports = router;