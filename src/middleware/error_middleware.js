/**
 * Error Middleware
 *
 * This middleware handles errors that occur during request processing.
 */
import logger from "../config/logger.js";
import { AppError } from "../utils/errors.js";

/**
 * Catch 404 errors and forward to error handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Set default values
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error details
  logger.error(`[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`);

  if (err.stack && process.env.NODE_ENV !== "production") {
    logger.error(err.stack);
  }

  // Determine if error is operational (expected) or programming (unexpected)
  const error = {
    success: false,
    status: statusCode,
    message,
  };

  // Include stack trace in development environment
  if (process.env.NODE_ENV === "development") {
    error.stack = err.stack;
  }

  res.status(statusCode).json(error);
};
