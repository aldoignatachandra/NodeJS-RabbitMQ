/**
 * Publisher Tests
 */
import { jest, describe, beforeEach, it, expect, afterEach } from "@jest/globals";
import { Publisher } from "../../src/rabbitmq/index.js";
import { Message } from "../../src/models/index.js";
import rabbitMQConnection from "../../src/rabbitmq/connection.js";

describe("Publisher", () => {
  let publisher;
  let mockChannel;

  // Setup before all tests
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();

    // Create mock channel object
    mockChannel = {
      assertExchange: jest.fn().mockResolvedValue({}),
      publish: jest.fn().mockReturnValue(true),
    };

    // Use spyOn to mock the methods of the singleton
    jest.spyOn(rabbitMQConnection, "createChannel").mockImplementation(() => {
      return Promise.resolve(mockChannel);
    });

    jest.spyOn(rabbitMQConnection, "close").mockImplementation(() => {
      return Promise.resolve();
    });

    // Create publisher instance
    publisher = new Publisher();
  });

  // Clean up after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("initialize()", () => {
    it("should create channel and assert exchange", async () => {
      await publisher.initialize();

      expect(rabbitMQConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.assertExchange).toHaveBeenCalledWith(
        publisher.exchange,
        publisher.exchangeType,
        publisher.exchangeOptions
      );
    });

    it("should handle initialization errors", async () => {
      const error = new Error("Connection failed");
      rabbitMQConnection.createChannel.mockImplementationOnce(() => {
        return Promise.reject(error);
      });

      await expect(publisher.initialize()).rejects.toThrow("Connection failed");
    });
  });

  describe("publish()", () => {
    const testMessage = { hello: "world" };
    const testRoutingKey = "test.key";

    beforeEach(async () => {
      // Initialize publisher before each publish test
      await publisher.initialize();
      // Clear mock calls from initialization
      jest.clearAllMocks();
    });

    it("should publish string messages correctly", async () => {
      await publisher.publish("test message", testRoutingKey);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        publisher.exchange,
        testRoutingKey,
        expect.any(Buffer),
        publisher.defaultMessageOptions
      );

      // Verify the Buffer contains our message
      const bufferArg = mockChannel.publish.mock.calls[0][2];
      expect(bufferArg.toString()).toBe("test message");
    });

    it("should publish object messages as JSON", async () => {
      await publisher.publish(testMessage, testRoutingKey);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        publisher.exchange,
        testRoutingKey,
        expect.any(Buffer),
        publisher.defaultMessageOptions
      );

      // Verify the Buffer contains JSON of our message
      const bufferArg = mockChannel.publish.mock.calls[0][2];
      expect(JSON.parse(bufferArg.toString())).toEqual(testMessage);
    });

    it("should publish Message instances correctly", async () => {
      const message = new Message(testMessage, "test.type");

      await publisher.publish(message, testRoutingKey);

      // Verify the Buffer contains JSON of our message
      const bufferArg = mockChannel.publish.mock.calls[0][2];
      const published = JSON.parse(bufferArg.toString());

      expect(published.data).toEqual(testMessage);
      expect(published.type).toBe("test.type");
    });

    it("should use default routing key when not specified", async () => {
      await publisher.publish(testMessage);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        publisher.exchange,
        publisher.defaultRoutingKey,
        expect.any(Buffer),
        publisher.defaultMessageOptions
      );
    });

    it("should merge custom options with defaults", async () => {
      const customOptions = { expiration: "1000", priority: 5 };

      await publisher.publish(testMessage, testRoutingKey, customOptions);

      expect(mockChannel.publish).toHaveBeenCalledWith(
        publisher.exchange,
        testRoutingKey,
        expect.any(Buffer),
        expect.objectContaining({
          ...publisher.defaultMessageOptions,
          ...customOptions,
        })
      );
    });

    it("should handle publishing errors", async () => {
      const error = new Error("Publish failed");
      mockChannel.publish.mockImplementationOnce(() => {
        throw error;
      });

      await expect(publisher.publish(testMessage)).rejects.toThrow("Publish failed");
    });
  });

  describe("close()", () => {
    it("should close the connection", async () => {
      await publisher.close();

      expect(rabbitMQConnection.close).toHaveBeenCalled();
    });
  });
});
