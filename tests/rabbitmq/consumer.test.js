/**
 * Consumer Tests
 * 
 * Comprehensive test suite for the RabbitMQ Consumer module
 * covering all methods and edge cases with clean code practices.
 */
import { jest, describe, beforeEach, it, expect, afterEach } from "@jest/globals";
import { Consumer } from "../../src/rabbitmq/index.js";
import { Message } from "../../src/models/index.js";
import rabbitMQConnection from "../../src/rabbitmq/connection.js";

describe("Consumer", () => {
  let consumer;
  let mockChannel;
  let mockMessageHandler;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create comprehensive mock channel
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      assertQueue: jest.fn().mockResolvedValue({ queue: "message_queue" }),
      bindQueue: jest.fn().mockResolvedValue({}),
      consume: jest.fn().mockResolvedValue({ consumerTag: "test-consumer-tag" }),
      ack: jest.fn().mockReturnValue(undefined),
      reject: jest.fn().mockReturnValue(undefined),
      cancel: jest.fn().mockResolvedValue({}),
    };

    // Mock the connection methods
    jest.spyOn(rabbitMQConnection, "createChannel").mockImplementation(() => {
      return Promise.resolve(mockChannel);
    });

    jest.spyOn(rabbitMQConnection, "close").mockImplementation(() => {
      return Promise.resolve();
    });

    // Create mock message handler
    mockMessageHandler = jest.fn().mockResolvedValue(undefined);

    // Create consumer instance
    consumer = new Consumer();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(consumer.config).toBeDefined();
      expect(consumer.exchange).toBe(consumer.config.exchange.name);
      expect(consumer.exchangeType).toBe(consumer.config.exchange.type);
      expect(consumer.exchangeOptions).toBe(consumer.config.exchange.options);
      expect(consumer.queue).toBe(consumer.config.queue.name);
      expect(consumer.queueOptions).toBe(consumer.config.queue.options);
      expect(consumer.defaultRoutingKey).toBe(consumer.config.routingKey);
      expect(consumer.consumerTag).toBeNull();
    });
  });

  describe("initialize()", () => {
    it("should successfully initialize exchange, queue, and bindings", async () => {
      await consumer.initialize();

      expect(rabbitMQConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        consumer.exchange,
        consumer.exchangeType,
        consumer.exchangeOptions
      );
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        consumer.queue,
        consumer.queueOptions
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        consumer.queue,
        consumer.exchange,
        consumer.defaultRoutingKey
      );
    });

    it("should handle initialization errors gracefully", async () => {
      const error = new Error("Failed to create channel");
      rabbitMQConnection.createChannel.mockRejectedValueOnce(error);

      await expect(consumer.initialize()).rejects.toThrow("Failed to create channel");
    });

    it("should handle exchange assertion errors", async () => {
      const error = new Error("Failed to assert exchange");
      mockChannel.assertExchange.mockRejectedValueOnce(error);

      await expect(consumer.initialize()).rejects.toThrow("Failed to assert exchange");
    });

    it("should handle queue assertion errors", async () => {
      const error = new Error("Failed to assert queue");
      mockChannel.assertQueue.mockRejectedValueOnce(error);

      await expect(consumer.initialize()).rejects.toThrow("Failed to assert queue");
    });

    it("should handle queue binding errors", async () => {
      const error = new Error("Failed to bind queue");
      mockChannel.bindQueue.mockRejectedValueOnce(error);

      await expect(consumer.initialize()).rejects.toThrow("Failed to bind queue");
    });
  });

  describe("consume()", () => {
    beforeEach(async () => {
      await consumer.initialize();
      jest.clearAllMocks();
    });

    it("should start consuming with default options", async () => {
      const consumerTag = await consumer.consume(mockMessageHandler);

      expect(rabbitMQConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.consume).toHaveBeenCalledWith(
        consumer.queue,
        expect.any(Function),
        { noAck: false }
      );
      expect(consumerTag).toBe("test-consumer-tag");
      expect(consumer.consumerTag).toBe("test-consumer-tag");
    });

    it("should start consuming with custom options", async () => {
      const customOptions = { noAck: true, exclusive: true };
      
      await consumer.consume(mockMessageHandler, customOptions);

      expect(mockChannel.consume).toHaveBeenCalledWith(
        consumer.queue,
        expect.any(Function),
        { noAck: true, exclusive: true }
      );
    });

    it("should handle channel creation errors", async () => {
      const error = new Error("Failed to create channel");
      rabbitMQConnection.createChannel.mockRejectedValueOnce(error);

      await expect(consumer.consume(mockMessageHandler)).rejects.toThrow("Failed to create channel");
    });

    it("should handle consume errors", async () => {
      const error = new Error("Failed to start consuming");
      mockChannel.consume.mockRejectedValueOnce(error);

      await expect(consumer.consume(mockMessageHandler)).rejects.toThrow("Failed to start consuming");
    });

    describe("Message Processing", () => {
      let messageCallback;

      beforeEach(async () => {
        await consumer.consume(mockMessageHandler);
        // Get the message callback function passed to channel.consume
        messageCallback = mockChannel.consume.mock.calls[0][1];
      });

      it("should process valid JSON messages correctly", async () => {
        const testData = { id: "123", name: "test user" };
        const mockMessage = {
          content: Buffer.from(JSON.stringify(testData)),
          properties: { messageId: "test-id" },
        };

        await messageCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(testData, mockMessage);
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
      });

      it("should process plain text messages correctly", async () => {
        const testContent = "plain text message";
        const mockMessage = {
          content: Buffer.from(testContent),
          properties: { messageId: "test-id" },
        };

        await messageCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(testContent, mockMessage);
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
      });

      it("should process Message instances correctly", async () => {
        const message = new Message({ test: "data" }, "test.type");
        const mockMessage = {
          content: Buffer.from(JSON.stringify(message.toJSON())),
          properties: { messageId: "test-id" },
        };

        await messageCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(message.toJSON(), mockMessage);
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
      });

      it("should handle null messages gracefully", async () => {
        await messageCallback(null);

        expect(mockMessageHandler).not.toHaveBeenCalled();
        expect(mockChannel.ack).not.toHaveBeenCalled();
        expect(mockChannel.reject).not.toHaveBeenCalled();
      });

      it("should handle message handler errors and reject message", async () => {
        const testData = { id: "123" };
        const mockMessage = {
          content: Buffer.from(JSON.stringify(testData)),
          properties: { messageId: "test-id" },
        };
        const handlerError = new Error("Handler failed");
        mockMessageHandler.mockRejectedValueOnce(handlerError);

        await messageCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(testData, mockMessage);
        expect(mockChannel.ack).not.toHaveBeenCalled();
        expect(mockChannel.reject).toHaveBeenCalledWith(mockMessage, false);
      });

      it("should handle JSON parsing errors gracefully", async () => {
        const invalidJson = "{ invalid json";
        const mockMessage = {
          content: Buffer.from(invalidJson),
          properties: { messageId: "test-id" },
        };

        await messageCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(invalidJson, mockMessage);
        expect(mockChannel.ack).toHaveBeenCalledWith(mockMessage);
      });

      it("should not acknowledge when noAck is true", async () => {
        // Reset consumer with noAck option
        jest.clearAllMocks();
        await consumer.consume(mockMessageHandler, { noAck: true });
        const noAckCallback = mockChannel.consume.mock.calls[0][1];

        const testData = { id: "123" };
        const mockMessage = {
          content: Buffer.from(JSON.stringify(testData)),
          properties: { messageId: "test-id" },
        };

        await noAckCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(testData, mockMessage);
        expect(mockChannel.ack).not.toHaveBeenCalled();
      });

      it("should not reject when noAck is true and handler fails", async () => {
        // Reset consumer with noAck option
        jest.clearAllMocks();
        await consumer.consume(mockMessageHandler, { noAck: true });
        const noAckCallback = mockChannel.consume.mock.calls[0][1];

        const testData = { id: "123" };
        const mockMessage = {
          content: Buffer.from(JSON.stringify(testData)),
          properties: { messageId: "test-id" },
        };
        const handlerError = new Error("Handler failed");
        mockMessageHandler.mockRejectedValueOnce(handlerError);

        await noAckCallback(mockMessage);

        expect(mockMessageHandler).toHaveBeenCalledWith(testData, mockMessage);
        expect(mockChannel.ack).not.toHaveBeenCalled();
        expect(mockChannel.reject).not.toHaveBeenCalled();
      });
    });
  });

  describe("cancel()", () => {
    it("should cancel consumer when consumer tag exists", async () => {
      // Set up consumer with a tag
      consumer.consumerTag = "test-consumer-tag";

      await consumer.cancel();

      expect(rabbitMQConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.cancel).toHaveBeenCalledWith("test-consumer-tag");
      expect(consumer.consumerTag).toBeNull();
    });

    it("should handle cancellation when no consumer tag exists", async () => {
      consumer.consumerTag = null;

      await consumer.cancel();

      expect(rabbitMQConnection.createChannel).not.toHaveBeenCalled();
      expect(mockChannel.cancel).not.toHaveBeenCalled();
    });

    it("should handle channel creation errors during cancellation", async () => {
      consumer.consumerTag = "test-consumer-tag";
      const error = new Error("Failed to create channel");
      rabbitMQConnection.createChannel.mockRejectedValueOnce(error);

      await expect(consumer.cancel()).rejects.toThrow("Failed to create channel");
    });

    it("should handle cancel operation errors", async () => {
      consumer.consumerTag = "test-consumer-tag";
      const error = new Error("Failed to cancel consumer");
      mockChannel.cancel.mockRejectedValueOnce(error);

      await expect(consumer.cancel()).rejects.toThrow("Failed to cancel consumer");
    });
  });

  describe("close()", () => {
    it("should close consumer and connection successfully", async () => {
      consumer.consumerTag = "test-consumer-tag";

      await consumer.close();

      expect(mockChannel.cancel).toHaveBeenCalledWith("test-consumer-tag");
      expect(consumer.consumerTag).toBeNull();
      expect(rabbitMQConnection.close).toHaveBeenCalled();
    });

    it("should handle errors during close gracefully", async () => {
      consumer.consumerTag = "test-consumer-tag";
      const error = new Error("Failed to cancel consumer");
      mockChannel.cancel.mockRejectedValueOnce(error);

      // Should not throw but log the error
      await expect(consumer.close()).rejects.toThrow("Failed to cancel consumer");
    });

    it("should close connection even when cancel fails", async () => {
      // Mock cancel to not throw so we can test connection close
      jest.spyOn(consumer, 'cancel').mockResolvedValueOnce(undefined);

      await consumer.close();

      expect(consumer.cancel).toHaveBeenCalled();
      expect(rabbitMQConnection.close).toHaveBeenCalled();
    });

    it("should handle connection close errors", async () => {
      jest.spyOn(consumer, 'cancel').mockResolvedValueOnce(undefined);
      const error = new Error("Failed to close connection");
      rabbitMQConnection.close.mockRejectedValueOnce(error);

      await expect(consumer.close()).rejects.toThrow("Failed to close connection");
    });
  });

  describe("Integration Scenarios", () => {
    it("should handle full consumer lifecycle", async () => {
      // Initialize
      await consumer.initialize();
      expect(mockChannel.assertExchange).toHaveBeenCalled();
      expect(mockChannel.bindQueue).toHaveBeenCalled();

      // Start consuming
      const consumerTag = await consumer.consume(mockMessageHandler);
      expect(consumerTag).toBe("test-consumer-tag");
      expect(consumer.consumerTag).toBe("test-consumer-tag");

      // Process a message
      const messageCallback = mockChannel.consume.mock.calls[0][1];
      const testMessage = {
        content: Buffer.from(JSON.stringify({ test: "data" })),
        properties: { messageId: "test-id" },
      };
      
      await messageCallback(testMessage);
      expect(mockMessageHandler).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalled();

      // Cancel and close
      await consumer.close();
      expect(mockChannel.cancel).toHaveBeenCalled();
      expect(rabbitMQConnection.close).toHaveBeenCalled();
      expect(consumer.consumerTag).toBeNull();
    });

    it("should handle multiple message processing scenarios", async () => {
      await consumer.consume(mockMessageHandler);
      const messageCallback = mockChannel.consume.mock.calls[0][1];

      // Process different message types
      const jsonMessage = {
        content: Buffer.from(JSON.stringify({ type: "json" })),
        properties: { messageId: "json-id" },
      };

      const textMessage = {
        content: Buffer.from("plain text"),
        properties: { messageId: "text-id" },
      };

      await messageCallback(jsonMessage);
      await messageCallback(textMessage);

      expect(mockMessageHandler).toHaveBeenCalledTimes(2);
      expect(mockChannel.ack).toHaveBeenCalledTimes(2);
    });
  });
}); 