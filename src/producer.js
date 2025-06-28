/**
 * Standalone Producer Script
 *
 * This script demonstrates how to use the producer to send messages
 * to RabbitMQ without the full Express application.
 */
import dotenv from "dotenv";
import { Publisher } from "./rabbitmq/index.js";
import { Message, User } from "./models/index.js";
import logger from "./config/logger.js";
import { v4 as uuidv4 } from "uuid";

// Load environment variables
dotenv.config();

// Sample user data
const sampleUsers = [
  { email: "john.doe@example.com", name: "John Doe" },
  { email: "jane.smith@example.com", name: "Jane Smith" },
  { email: "bob.johnson@example.com", name: "Bob Johnson" },
  { email: "alice.williams@example.com", name: "Alice Williams" },
  { email: "charlie.brown@example.com", name: "Charlie Brown" },
];

/**
 * Send a user registration message
 */
async function sendUserRegistrationMessage(publisher, userData) {
  try {
    // Create user
    const user = new User(userData.email, userData.name);

    // Add some mock data
    user.id = uuidv4();
    user.createdAt = new Date().toISOString();

    logger.info(`Publishing message for user: ${user.email}`);

    // Create message with user data
    const message = new Message(user.toJSON(), "user.registered", {
      source: "standalone-producer",
    });

    // Publish the message
    const result = await publisher.publish(message);

    if (result) {
      logger.info(`Successfully published message for user: ${user.email}`);
    } else {
      logger.warn(`Failed to publish message for user: ${user.email}`);
    }

    return result;
  } catch (error) {
    logger.error(`Error sending user registration message: ${error.message}`);
    throw error;
  }
}

/**
 * Main function to send several sample messages
 */
async function main() {
  const publisher = new Publisher();

  try {
    // Initialize publisher
    logger.info("Initializing publisher...");
    await publisher.initialize();

    // Publish messages for each sample user
    logger.info("Sending sample user registration messages...");

    for (const userData of sampleUsers) {
      await sendUserRegistrationMessage(publisher, userData);

      // Add a small delay between messages
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    logger.info("All messages sent successfully");
  } catch (error) {
    logger.error(`Producer error: ${error.message}`);
    process.exit(1);
  } finally {
    // Close the publisher
    logger.info("Closing publisher...");
    await publisher.close();
    logger.info("Publisher closed");
  }
}

// Run the producer
main();
