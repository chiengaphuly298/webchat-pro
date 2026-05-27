/**
 * Error Handler Middleware
 * Centralized error handling for Express
 */

/**
 * Not Found Handler - 404
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: error.message,
    path: req.originalUrl
  });
};

/**
 * Global Error Handler
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine status code
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  }

  if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Duplicate entry - resource already exists';
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference - related resource not found';
  }

  // Don't leak error details in production
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err.message
    })
  };

  res.status(statusCode).json(response);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, details) {
    return new ApiError(409, message, details);
  }

  static serverError(message = 'Internal server error') {
    return new ApiError(500, message);
  }
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  ApiError
};