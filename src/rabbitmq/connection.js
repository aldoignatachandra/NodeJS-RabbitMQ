/**
 * RabbitMQ Connection Module
 *
 * This module provides functionality to establish and manage
 * connections to RabbitMQ message broker.
 */
import amqp from "amqplib";
import { rabbitmqConfig } from "../config/index.js";
import logger from "../config/logger.js";

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.connectionRetries = 0;
    this.isConnecting = false;
    this.config = rabbitmqConfig;
  }

  /**
   * Establish connection to RabbitMQ server
   * @returns {Promise<amqp.Connection>} RabbitMQ connection
   */
  async connect() {
    if (this.connection) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait until existing connection attempt completes
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
      return this.connection;
    }

    this.isConnecting = true;

    try {
      const { protocol, hostname, port, username, password, vhost } = this.config.connection;
      const connectionString = `${protocol}://${username}:${password}@${hostname}:${port}${vhost}`;

      logger.info(`Connecting to RabbitMQ at ${hostname}:${port}...`);
      this.connection = await amqp.connect(connectionString);

      this.connectionRetries = 0;
      logger.info("Successfully connected to RabbitMQ");

      this.connection.on("error", (err) => {
        logger.error(`RabbitMQ connection error: ${err.message}`);
        this.handleConnectionError();
      });

      this.connection.on("close", () => {
        logger.warn("RabbitMQ connection closed");
        this.handleConnectionError();
      });

      return this.connection;
    } catch (error) {
      logger.error(`Failed to connect to RabbitMQ: ${error.message}`);
      this.handleConnectionError();
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Handle connection errors with reconnection logic
   */
  handleConnectionError() {
    this.connection = null;
    this.channel = null;

    if (this.connectionRetries < this.config.connection.reconnectAttempts) {
      const delay = this.config.connection.reconnectInterval;
      this.connectionRetries++;

      logger.info(
        `Attempting to reconnect to RabbitMQ in ${delay}ms (attempt ${this.connectionRetries}/${this.config.connection.reconnectAttempts})`
      );

      setTimeout(() => {
        this.connect().catch((err) => {
          logger.error(`Reconnection attempt failed: ${err.message}`);
        });
      }, delay);
    } else {
      logger.error(
        `Max reconnection attempts (${this.config.connection.reconnectAttempts}) reached. Giving up.`
      );
    }
  }

  /**
   * Create a channel on the current connection
   * @returns {Promise<amqp.Channel>} RabbitMQ channel
   */
  async createChannel() {
    if (this.channel) {
      return this.channel;
    }

    try {
      const connection = await this.connect();
      this.channel = await connection.createChannel();

      logger.info("RabbitMQ channel created successfully");

      this.channel.on("error", (err) => {
        logger.error(`RabbitMQ channel error: ${err.message}`);
        this.channel = null;
      });

      this.channel.on("close", () => {
        logger.warn("RabbitMQ channel closed");
        this.channel = null;
      });

      return this.channel;
    } catch (error) {
      logger.error(`Failed to create RabbitMQ channel: ${error.message}`);
      this.channel = null;
      throw error;
    }
  }

  /**
   * Close connection and channel
   */
  async close() {
    try {
      if (this.channel) {
        logger.info("Closing RabbitMQ channel...");
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        logger.info("Closing RabbitMQ connection...");
        await this.connection.close();
        this.connection = null;
      }

      logger.info("RabbitMQ connection and channel closed successfully");
    } catch (error) {
      logger.error(`Error while closing RabbitMQ connections: ${error.message}`);
      this.connection = null;
      this.channel = null;
    }
  }
}

// Export a singleton instance
export default new RabbitMQConnection();
