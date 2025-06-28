/**
 * Message Model
 *
 * This module defines the structure of messages being exchanged through RabbitMQ,
 * with validation and standardization methods.
 */
import { v4 as uuidv4 } from "uuid";

/**
 * Message class to standardize message format
 */
class Message {
  /**
   * Create a new message
   * @param {Object} data - Message payload
   * @param {string} [type] - Message type for routing/filtering
   * @param {Object} [metadata] - Additional metadata
   */
  constructor(data, type = "default", metadata = {}) {
    this.id = uuidv4();
    this.timestamp = Date.now();
    this.type = type;
    this.data = data;
    this.metadata = {
      ...metadata,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Validate message structure and contents
   * @returns {boolean} True if valid, throws error otherwise
   */
  validate() {
    // Check if required properties exist
    if (this.data === undefined || this.data === null) {
      throw new Error("Message data is required");
    }

    if (typeof this.type !== "string" || this.type.trim() === "") {
      throw new Error("Message type must be a non-empty string");
    }

    return true;
  }

  /**
   * Convert message to plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      data: this.data,
      metadata: this.metadata,
    };
  }

  /**
   * Create a message instance from raw message data
   * @param {Object|string} rawMessage - Raw message data
   * @returns {Message} Message instance
   */
  static fromJSON(rawMessage) {
    let parsed;

    if (typeof rawMessage === "string") {
      parsed = JSON.parse(rawMessage);
    } else {
      parsed = rawMessage;
    }

    const message = new Message(parsed.data, parsed.type, parsed.metadata);
    message.id = parsed.id || uuidv4();
    message.timestamp = parsed.timestamp || Date.now();

    return message;
  }
}

export default Message;
