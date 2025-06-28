/**
 * Server Configuration
 *
 * This module exports server-related configuration settings
 * based on environment variables.
 */
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
  isDevelopment: process.env.NODE_ENV === "development" || !process.env.NODE_ENV,
};
