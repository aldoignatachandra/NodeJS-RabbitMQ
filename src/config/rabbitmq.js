/**
 * RabbitMQ Configuration
 *
 * This module exports configuration settings for RabbitMQ connection
 * and exchanges/queues based on environment variables.
 */
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  connection: {
    protocol: "amqp",
    hostname: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT || "5672", 10),
    username: process.env.RABBITMQ_USER || "guest",
    password: process.env.RABBITMQ_PASSWORD || "guest",
    vhost: process.env.RABBITMQ_VHOST || "/",
    reconnectInterval: parseInt(process.env.RABBITMQ_RECONNECT_INTERVAL || "5000", 10),
    reconnectAttempts: parseInt(process.env.RABBITMQ_RECONNECT_ATTEMPTS || "10", 10),
  },

  // Exchange and queue configuration
  exchange: {
    name: process.env.RABBITMQ_EXCHANGE || "message_exchange",
    type: "topic",
    options: {
      durable: true,
      autoDelete: false,
    },
  },

  queue: {
    name: process.env.RABBITMQ_QUEUE || "message_queue",
    options: {
      durable: true,
      autoDelete: false,
    },
  },

  routingKey: process.env.RABBITMQ_ROUTING_KEY || "message.new",

  // Default message options
  messageOptions: {
    persistent: true,
  },
};
