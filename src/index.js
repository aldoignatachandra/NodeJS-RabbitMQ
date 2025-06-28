/**
 * Application Entry Point
 *
 * This is the main entry point for the application that starts
 * the Express server and initializes required services.
 */
import app from "./app.js";
import { serverConfig } from "./config/index.js";
import logger from "./config/logger.js";
import { userService } from "./services/index.js";
import fs from "fs";
import path from "path";

// Ensure logs directory exists
const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

/**
 * Initialize application services
 */
async function initializeServices() {
  try {
    // Initialize user service (and RabbitMQ connections)
    await userService.initialize();
    logger.info("Services initialized successfully");
  } catch (error) {
    logger.error(`Failed to initialize services: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Start the Express server
 */
async function startServer() {
  try {
    const PORT = serverConfig.port;

    app.listen(PORT, () => {
      logger.info(`Server running in ${serverConfig.nodeEnv} mode on port ${PORT}`);
      logger.info(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
const shutdownGracefully = async () => {
  logger.info("Shutting down gracefully...");

  try {
    // Close service connections
    await userService.close();
    logger.info("All services closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error(`Error during shutdown: ${error.message}`);
    process.exit(1);
  }
};

// Handle termination signals
process.on("SIGTERM", shutdownGracefully);
process.on("SIGINT", shutdownGracefully);

// Start the application
(async () => {
  try {
    await initializeServices();
    await startServer();
  } catch (error) {
    logger.error(`Application failed to start: ${error.message}`);
    process.exit(1);
  }
})();
