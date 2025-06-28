/**
 * Database Configuration
 *
 * This module exports MongoDB connection configuration
 * based on environment variables.
 */
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/message_db",
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
