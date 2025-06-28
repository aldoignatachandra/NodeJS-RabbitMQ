/**
 * User Service
 *
 * This service handles user-related business logic, including
 * user registration and message queue integration.
 */
import { Message, User } from "../models/index.js";
import { Publisher } from "../rabbitmq/index.js";
import { ValidationError } from "../utils/errors.js";
import logger from "../config/logger.js";

class UserService {
  constructor() {
    this.publisher = new Publisher();
    this.users = new Map(); // In-memory storage for demo purposes
  }

  /**
   * Initialize the service
   */
  async initialize() {
    await this.publisher.initialize();
    logger.info("User service initialized");
  }

  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  async registerUser(userData) {
    try {
      // Create and validate user
      const user = new User(userData.email, userData.name, userData);
      user.validate();

      // In a real app, save to database here
      this.users.set(user.id, user);
      logger.info(`User registered: ${user.id} (${user.email})`);

      // Create a message for the registration event
      const message = new Message(user.toJSON(), "user.registered", { source: "user-service" });

      // Publish the registration event
      await this.publisher.publish(message);
      logger.info(`Published user registration event for ${user.id}`);

      return user;
    } catch (error) {
      logger.error(`User registration failed: ${error.message}`);

      if (error.message.includes("Email") || error.message.includes("Name")) {
        throw new ValidationError(error.message);
      }

      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {User|null} User if found, null otherwise
   */
  async getUserById(userId) {
    return this.users.get(userId) || null;
  }

  /**
   * Get all users
   * @returns {User[]} Array of users
   */
  async getAllUsers() {
    return Array.from(this.users.values());
  }

  /**
   * Close service connections
   */
  async close() {
    await this.publisher.close();
    logger.info("User service shut down");
  }
}

export default new UserService();
