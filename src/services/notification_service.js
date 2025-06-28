/**
 * Notification Service
 *
 * This service consumes messages from RabbitMQ and handles
 * notification-related tasks, such as email notifications.
 */
import { Consumer } from "../rabbitmq/index.js";
import { Message } from "../models/index.js";
import logger from "../config/logger.js";

class NotificationService {
  constructor() {
    this.consumer = new Consumer();
    this.isRunning = false;
  }

  /**
   * Initialize the service and start consuming messages
   */
  async initialize() {
    try {
      await this.consumer.initialize();
      logger.info("Notification service initialized");

      // Start consuming messages
      await this.startConsuming();
    } catch (error) {
      logger.error(`Failed to initialize notification service: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start consuming messages from the queue
   */
  async startConsuming() {
    if (this.isRunning) {
      logger.warn("Consumer is already running");
      return;
    }

    try {
      this.isRunning = true;

      // Start consuming messages with the message handler
      await this.consumer.consume(this.handleMessage.bind(this));
      logger.info("Started consuming messages for notifications");
    } catch (error) {
      this.isRunning = false;
      logger.error(`Failed to start consuming messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle incoming messages
   * @param {Object|string} content - Message content
   * @param {Object} originalMessage - Original amqplib message
   */
  async handleMessage(content, originalMessage) {
    try {
      // Parse message if it's not already parsed
      const message = content instanceof Message ? content : Message.fromJSON(content);

      logger.info(`Received message: ${message.id} (${message.type})`);

      // Process message based on type
      switch (message.type) {
        case "user.registered":
          await this.handleUserRegistration(message.data);
          break;

        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message: ${error.message}`);
      // In a real application, handle errors more gracefully
      // Could implement retry logic, dead letter queues, etc.
    }
  }

  /**
   * Handle user registration notifications
   * @param {Object} userData - User data
   */
  async handleUserRegistration(userData) {
    try {
      logger.info(`Processing registration notification for user: ${userData.email}`);

      // In a real application, we would send an actual email
      // This is a mock implementation
      await this.mockSendEmail(
        userData.email,
        "Welcome to Our Service!",
        `Hi ${userData.name},\n\nThank you for registering with our service!`
      );

      logger.info(`Sent welcome email to ${userData.email}`);
    } catch (error) {
      logger.error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Mock sending an email
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @returns {Promise<void>}
   */
  async mockSendEmail(to, subject, body) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log email details
    logger.info("====== MOCK EMAIL ======");
    logger.info(`To: ${to}`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Body:\n${body}`);
    logger.info("=======================");

    // In a real app, we would use a library like nodemailer
    return true;
  }

  /**
   * Stop consuming messages
   */
  async stopConsuming() {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.consumer.cancel();
      this.isRunning = false;
      logger.info("Stopped consuming messages");
    } catch (error) {
      logger.error(`Failed to stop consuming messages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close service connections
   */
  async close() {
    try {
      await this.stopConsuming();
      await this.consumer.close();
      logger.info("Notification service shut down");
    } catch (error) {
      logger.error(`Error while shutting down notification service: ${error.message}`);
    }
  }
}

export default new NotificationService();
