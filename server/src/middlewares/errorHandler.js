import { config } from '../config/env.js';

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // 1. Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `An account with this ${field} already exists.`;
  }

  // 2. Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((val) => val.message);
  }

  // 3. Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for resource: ${err.value}`;
  }

  // 4. JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired.';
  }

  // 5. Multer File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = `File too large. Maximum allowed size is ${(config.upload.maxFileSize / (1024 * 1024)).toFixed(0)}MB.`;
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field in upload payload.';
  }

  // 6. AI Provider Errors (Sanitize and ensure no secrets leak)
  if (message.includes('API key') || message.includes('API_KEY') || message.includes('GoogleGenerativeAI')) {
    statusCode = 502;
    message = 'The AI writing service is currently experiencing high demand or configuring. Please try again shortly.';
  }

  // Structured sanitized response
  const responsePayload = {
    success: false,
    message,
  };

  if (errors) {
    responsePayload.errors = errors;
  }

  if (config.env === 'development' && statusCode === 500) {
    responsePayload.debug = {
      name: err.name,
      stack: err.stack,
    };
  }

  // Log error without sensitive payload
  console.error(`❌ [${req.method}] ${req.originalUrl} - Status: ${statusCode} - Error: ${message}`);

  return res.status(statusCode).json(responsePayload);
};
