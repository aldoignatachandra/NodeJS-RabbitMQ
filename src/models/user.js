/**
 * User Model
 *
 * This module defines the user data structure and validation.
 * For demonstration purposes, this is a simple class but in a real
 * application this would likely use an ORM like Mongoose/Sequelize.
 */
import { v4 as uuidv4 } from "uuid";

class User {
  /**
   * Create a new user
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {Object} [additionalData] - Additional user data
   */
  constructor(email, name, additionalData = {}) {
    this.id = uuidv4();
    this.email = email;
    this.name = name;
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();

    // Add any additional data
    Object.assign(this, additionalData);
  }

  /**
   * Validate user data
   * @returns {boolean} True if valid, throws error otherwise
   */
  validate() {
    // Validate email
    if (!this.email || typeof this.email !== "string") {
      throw new Error("Email is required and must be a string");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error("Invalid email format");
    }

    // Validate name
    if (!this.name || typeof this.name !== "string") {
      throw new Error("Name is required and must be a string");
    }

    if (this.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }

    return true;
  }

  /**
   * Convert user to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create a user instance from raw user data
   * @param {Object|string} rawUser - Raw user data
   * @returns {User} User instance
   */
  static fromJSON(rawUser) {
    let parsed;

    if (typeof rawUser === "string") {
      parsed = JSON.parse(rawUser);
    } else {
      parsed = rawUser;
    }

    const user = new User(parsed.email, parsed.name);

    // Copy all other properties
    Object.keys(parsed).forEach((key) => {
      if (key !== "email" && key !== "name") {
        user[key] = parsed[key];
      }
    });

    return user;
  }
}

export default User;
