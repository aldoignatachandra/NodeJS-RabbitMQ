/**
 * Standalone Consumer Script
 *
 * This module implements a consumer that processes messages from RabbitMQ
 * and delegates business logic to appropriate services.
 */
import dotenv from "dotenv";
import { Consumer } from "./rabbitmq/index.js";
import { Message } from "./models/index.js";
import logger from "./config/logger.js";
import NotificationService from "./services/notification_service.js";

// Load environment variables
dotenv.config();

/**
 * MessageProcessor
 *
 * Responsible for processing different types of messages and
 * orchestrating appropriate service calls
 */
class MessageProcessor {
  constructor() {
    this.notificationService = NotificationService;
    this.consumer = new Consumer();
  }

  /**
   * Initialize processor and dependencies
   */
  async initialize() {
    logger.info("Initializing message processor and services...");
    await this.notificationService.initialize();
    await this.consumer.initialize();
    logger.info("Message processor initialized successfully");
  }

  /**
   * Start processing messages
   */
  async startProcessing() {
    logger.info("Starting to consume messages...");
    await this.consumer.consume(this.handleMessage.bind(this));
    logger.info("Consumer is running. Press Ctrl+C to exit.");

    // Keep the process running
    process.stdin.resume();
  }

  /**
   * Message handler for all incoming messages
   *
   * @param {Object|string} content - Message content
   * @param {Object} originalMessage - Original amqplib message
   */
  async handleMessage(content, originalMessage) {
    try {
      // Parse message content if needed
      const message = content instanceof Message ? content : Message.fromJSON(content);

      logger.info(`Processing message: ${message.id} (${message.type})`);

      // Route message to appropriate handler based on type
      switch (message.type) {
        case "user.registered":
          await this.handleUserRegistered(message.data);
          break;

        // Handle other message types here

        default:
          logger.warn(`Unhandled message type: ${message.type}`);
          break;
      }
    } catch (error) {
      logger.error(`Failed to process message: ${error.message}`);
      // In production, you might want to move the message to a DLQ (Dead Letter Queue)
    }
  }

  /**
   * Handle user registration event
   * Delegates to appropriate services based on business requirements
   *
   * @param {Object} userData - User registration data
   */
  async handleUserRegistered(userData) {
    try {
      logger.info(`Processing user registration: ${userData.id} (${userData.email})`);

      // Log registration details
      this.logRegistrationDetails(userData);

      // Send welcome email via notification service
      await this.notificationService.handleUserRegistration(userData);

      // In a real application, you might also:
      // - Create user resources in other systems
      // - Add the user to marketing campaigns
      // - Update analytics

      logger.info(`User registration processed successfully: ${userData.id}`);
    } catch (error) {
      logger.error(`Error processing user registration: ${error.message}`);
    }
  }

  /**
   * Log user registration details for debugging
   *
   * @param {Object} userData - User data
   */
  logRegistrationDetails(userData) {
    logger.info("========================================");
    logger.info("USER REGISTRATION RECEIVED");
    logger.info("----------------------------------------");
    logger.info(`ID:    ${userData.id}`);
    logger.info(`Email: ${userData.email}`);
    logger.info(`Name:  ${userData.name}`);
    logger.info(`Date:  ${userData.createdAt}`);
    logger.info("----------------------------------------");
  }

  /**
   * Gracefully shut down the processor
   */
  async shutdown() {
    logger.info("Shutting down message processor...");

    try {
      // Close all service connections
      await this.notificationService.close();
      await this.consumer.close();

      logger.info("Message processor shut down successfully");
    } catch (error) {
      logger.error(`Error during shutdown: ${error.message}`);
    }
  }
}

/**
 * Main application function
 */
async function main() {
  const processor = new MessageProcessor();

  try {
    // Initialize and start processing
    await processor.initialize();
    await processor.startProcessing();

    // Setup graceful shutdown
    const shutdownGracefully = async () => {
      await processor.shutdown();
      process.exit(0);
    };

    // Handle termination signals
    process.on("SIGINT", shutdownGracefully);
    process.on("SIGTERM", shutdownGracefully);
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Start the application
main();
