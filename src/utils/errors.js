/**
 * Error Handling Utilities
 *
 * This module provides standardized error classes and handling
 * functionality for the application.
 */
import logger from "../config/logger.js";

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error specifically for validation failures
 */
export class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

/**
 * Error for when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Error for when RabbitMQ operations fail
 */
export class MessageQueueError extends AppError {
  constructor(message, originalError = null) {
    super(`Message queue operation failed: ${message}`, 500);
    this.name = "MessageQueueError";
    this.originalError = originalError;
  }
}

/**
 * Global error handler for unexpected exceptions
 * @param {Error} error - The error that occurred
 */
export const handleGlobalError = (error) => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(error.stack);

  // Exit process in case of critical errors in production
  if (process.env.NODE_ENV === "production" && !error.isOperational) {
    logger.error("Fatal error: shutting down process");
    process.exit(1);
  }
};

/**
 * Async function wrapper to avoid try-catch blocks
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
