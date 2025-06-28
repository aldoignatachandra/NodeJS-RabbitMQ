/**
 * Express Application Setup
 *
 * This module configures and exports the Express application.
 */
import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import apiRoutes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error_middleware.js";
import { handleGlobalError } from "./utils/errors.js";
import logger from "./config/logger.js";
import { serverConfig } from "./config/index.js";

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware - use morgan in development
if (serverConfig.isDevelopment) {
  app.use(morgan("dev"));
}

// Set security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// API routes
app.use("/api", apiRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Node.js RabbitMQ Demo API",
    env: serverConfig.nodeEnv,
    docs: "/api",
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  handleGlobalError(error);

  if (serverConfig.isProduction) {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise);
  logger.error("Reason:", reason);

  if (serverConfig.isProduction) {
    process.exit(1);
  }
});

export default app;
