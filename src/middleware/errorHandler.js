/**
 * Error handler middleware
 * Handles all errors in the application
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || {};
  
  res.status(statusCode).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      details
    }
  });
};

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
  
  static badRequest(message, details) {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }
  
  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }
  
  static forbidden(message = 'Forbidden') {
    return new ApiError(message, 403, 'FORBIDDEN');
  }
  
  static notFound(message = 'Resource not found') {
    return new ApiError(message, 404, 'NOT_FOUND');
  }
  
  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(message, 429, 'TOO_MANY_REQUESTS');
  }
  
  static internal(message = 'Internal server error') {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }
}

module.exports = {
  errorHandler,
  ApiError
};
