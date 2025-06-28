/**
 * RabbitMQ Publisher Module
 *
 * This module provides functionality to publish messages to RabbitMQ exchanges.
 */
import { rabbitmqConfig } from "../config/index.js";
import rabbitMQConnection from "./connection.js";
import logger from "../config/logger.js";

class Publisher {
  constructor() {
    this.config = rabbitmqConfig;
    this.exchange = this.config.exchange.name;
    this.exchangeType = this.config.exchange.type;
    this.exchangeOptions = this.config.exchange.options;
    this.defaultRoutingKey = this.config.routingKey;
    this.defaultMessageOptions = this.config.messageOptions;
  }

  /**
   * Initialize the publisher by creating the exchange
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const channel = await rabbitMQConnection.createChannel();

      // Assert the exchange
      await channel.assertExchange(this.exchange, this.exchangeType, this.exchangeOptions);

      logger.info(
        `Publisher initialized: Exchange '${this.exchange}' (${this.exchangeType}) created/verified`
      );
    } catch (error) {
      logger.error(`Failed to initialize publisher: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publish a message to the exchange
   * @param {Object|string} message - Message to publish (will be serialized to JSON if object)
   * @param {string} [routingKey] - Routing key for the message
   * @param {Object} [options] - Message options
   * @returns {Promise<boolean>} True if message was successfully sent
   */
  async publish(message, routingKey = this.defaultRoutingKey, options = {}) {
    try {
      const channel = await rabbitMQConnection.createChannel();

      // Ensure exchange exists
      await channel.assertExchange(this.exchange, this.exchangeType, this.exchangeOptions);

      // Convert message to buffer if it's an object
      const content = Buffer.from(typeof message === "object" ? JSON.stringify(message) : message);

      // Merge default options with provided options
      const messageOptions = {
        ...this.defaultMessageOptions,
        ...options,
      };

      // Publish message to exchange with routing key
      const result = channel.publish(this.exchange, routingKey, content, messageOptions);

      if (result) {
        logger.info(
          `Message published to exchange '${this.exchange}' with routing key '${routingKey}'`
        );
      } else {
        logger.warn(`Channel write buffer is full - publish returned false`);
      }

      return result;
    } catch (error) {
      logger.error(`Failed to publish message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close the publisher
   */
  async close() {
    await rabbitMQConnection.close();
  }
}

export default Publisher;
