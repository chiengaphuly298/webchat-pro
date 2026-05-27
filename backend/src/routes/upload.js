/**
 * Upload Routes
 * Handles file and image uploads
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { supabaseAdmin } = require('../utils/supabase');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm',
    'application/pdf', 'application/doc', 'application/docx',
    'application/xls', 'application/xlsx',
    'text/plain', 'video/mp4', 'video/webm'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

/**
 * @route   POST /api/v1/upload/file
 * @desc    Upload file
 * @access  Private
 */
router.post('/file', protect, uploadLimiter, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      original_name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload image
 * @access  Private
 */
router.post('/image', protect, uploadLimiter, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded'
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

/**
 * @route   POST /api/v1/upload/voice
 * @desc    Upload voice message
 * @access  Private
 */
router.post('/voice', protect, uploadLimiter, upload.single('voice'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No audio file uploaded'
    });
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    }
  });
}));

/**
 * @route   DELETE /api/v1/upload/:filename
 * @desc    Delete uploaded file
 * @access  Private
 */
router.delete('/:filename', protect, asyncHandler(async (req, res) => {
  const filePath = path.join(process.env.UPLOAD_DIR || './uploads', req.params.filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({
    success: true,
    message: 'File deleted'
  });
}));

/**
 * Supabase Storage Upload (alternative)
 * @route   POST /api/v1/upload/supabase
 * @desc    Upload to Supabase Storage
 * @access  Private
 */
router.post('/supabase', protect, uploadLimiter, asyncHandler(async (req, res) => {
  const { file } = req.body;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file data provided'
    });
  }

  const buffer = Buffer.from(file, 'base64');
  const filename = `${uuidv4()}.jpg`;

  const { data, error } = await supabaseAdmin.storage
    .from('attachments')
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) {
    return res.status(500).json({
      success: false,
      message: 'Upload failed'
    });
  }

  const { data: urlData } = supabaseAdmin.storage
    .from('attachments')
    .getPublicUrl(data.Key);

  res.json({
    success: true,
    data: {
      url: urlData.publicUrl,
      filename: data.Key
    }
  });
}));

module.exports = router;