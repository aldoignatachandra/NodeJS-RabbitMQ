/**
 * RabbitMQ Consumer Module
 *
 * This module provides functionality to consume messages from RabbitMQ queues.
 */
import { rabbitmqConfig } from "../config/index.js";
import rabbitMQConnection from "./connection.js";
import logger from "../config/logger.js";

class Consumer {
  constructor() {
    this.config = rabbitmqConfig;
    this.exchange = this.config.exchange.name;
    this.exchangeType = this.config.exchange.type;
    this.exchangeOptions = this.config.exchange.options;
    this.queue = this.config.queue.name;
    this.queueOptions = this.config.queue.options;
    this.defaultRoutingKey = this.config.routingKey;
    this.consumerTag = null;
  }

  /**
   * Initialize the consumer by setting up exchange, queue and bindings
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const channel = await rabbitMQConnection.createChannel();

      // Assert the exchange
      await channel.assertExchange(this.exchange, this.exchangeType, this.exchangeOptions);

      // Assert the queue
      await channel.assertQueue(this.queue, this.queueOptions);

      // Bind queue to exchange with routing key
      await channel.bindQueue(this.queue, this.exchange, this.defaultRoutingKey);

      logger.info(
        `Consumer initialized: Queue '${this.queue}' bound to exchange '${this.exchange}' with routing key '${this.defaultRoutingKey}'`
      );
    } catch (error) {
      logger.error(`Failed to initialize consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start consuming messages from the queue
   * @param {Function} messageHandler - Callback function to process received messages
   * @param {Object} [options] - Consume options
   * @returns {Promise<string>} Consumer tag
   */
  async consume(messageHandler, options = {}) {
    try {
      const channel = await rabbitMQConnection.createChannel();

      // Default consume options
      const consumeOptions = {
        noAck: false, // Manual acknowledgement
        ...options,
      };

      // Start consuming
      const { consumerTag } = await channel.consume(
        this.queue,
        async (msg) => {
          if (!msg) {
            logger.warn("Received null message, consumer was cancelled");
            return;
          }

          try {
            // Parse message content
            const content = msg.content.toString();
            let parsedContent;

            try {
              parsedContent = JSON.parse(content);
            } catch (err) {
              parsedContent = content;
            }

            logger.debug(`Received message from queue '${this.queue}': ${content}`);

            // Process message with handler
            await messageHandler(parsedContent, msg);

            // Acknowledge the message if noAck is false
            if (!consumeOptions.noAck) {
              channel.ack(msg);
              logger.debug("Message acknowledged");
            }
          } catch (error) {
            logger.error(`Error processing message: ${error.message}`);

            // Reject the message (with requeue option)
            if (!consumeOptions.noAck) {
              channel.reject(msg, false); // Don't requeue to avoid poison messages
              logger.debug("Message rejected (not requeued)");
            }
          }
        },
        consumeOptions
      );

      this.consumerTag = consumerTag;
      logger.info(
        `Started consuming from queue '${this.queue}' with consumer tag '${consumerTag}'`
      );

      return consumerTag;
    } catch (error) {
      logger.error(`Failed to start consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel consuming messages
   * @returns {Promise<void>}
   */
  async cancel() {
    try {
      if (this.consumerTag) {
        const channel = await rabbitMQConnection.createChannel();
        await channel.cancel(this.consumerTag);
        logger.info(`Consumer '${this.consumerTag}' cancelled`);
        this.consumerTag = null;
      }
    } catch (error) {
      logger.error(`Failed to cancel consumer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Close the consumer
   */
  async close() {
    try {
      await this.cancel();
      await rabbitMQConnection.close();
    } catch (error) {
      logger.error(`Error while closing consumer: ${error.message}`);
      throw error;
    }
  }
}

export default Consumer;
