// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Database errors
  if (err.code === '23505') {
    // Unique constraint violation
    statusCode = 409;
    message = 'Duplicate entry. This record already exists.';
  } else if (err.code === '23503') {
    // Foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference. Related record does not exist.';
  } else if (err.code === '23502') {
    // Not null constraint violation
    statusCode = 400;
    message = 'Required field is missing.';
  } else if (err.code === '22P02') {
    // Invalid text representation
    statusCode = 400;
    message = 'Invalid data format.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 Not Found handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = {
  errorHandler,
  notFound,
};
