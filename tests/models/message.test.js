/**
 * Message Model Tests
 */
import { Message } from "../../src/models/index.js";

describe("Message Model", () => {
  const testData = { key: "value", number: 123 };
  const testType = "test.message";
  const testMetadata = { source: "test" };

  describe("Constructor", () => {
    it("should create a message with all properties", () => {
      const message = new Message(testData, testType, testMetadata);

      expect(message).toHaveProperty("id");
      expect(message).toHaveProperty("timestamp");
      expect(message.type).toBe(testType);
      expect(message.data).toEqual(testData);
      expect(message.metadata).toHaveProperty("source", "test");
      expect(message.metadata).toHaveProperty("createdAt");
    });

    it("should use default values when optional parameters are not provided", () => {
      const message = new Message(testData);

      expect(message.type).toBe("default");
      expect(message.metadata).toHaveProperty("createdAt");
    });
  });

  describe("validate()", () => {
    it("should pass validation for valid messages", () => {
      const message = new Message(testData, testType);

      expect(message.validate()).toBe(true);
    });

    it("should throw an error if data is missing", () => {
      const message = new Message(undefined, testType);

      expect(() => message.validate()).toThrow("Message data is required");
    });

    it("should throw an error if type is invalid", () => {
      const message = new Message(testData, "");

      expect(() => message.validate()).toThrow("Message type must be a non-empty string");

      message.type = 12345; // Not a string
      expect(() => message.validate()).toThrow("Message type must be a non-empty string");
    });
  });

  describe("toJSON()", () => {
    it("should convert message to plain object", () => {
      const message = new Message(testData, testType, testMetadata);
      const json = message.toJSON();

      expect(json).toEqual({
        id: message.id,
        timestamp: message.timestamp,
        type: testType,
        data: testData,
        metadata: message.metadata,
      });
    });
  });

  describe("fromJSON()", () => {
    it("should create a message instance from object", () => {
      const original = new Message(testData, testType, testMetadata);
      const json = original.toJSON();
      const recreated = Message.fromJSON(json);

      expect(recreated).toBeInstanceOf(Message);
      expect(recreated.id).toBe(original.id);
      expect(recreated.timestamp).toBe(original.timestamp);
      expect(recreated.type).toBe(original.type);
      expect(recreated.data).toEqual(original.data);
    });

    it("should create a message instance from JSON string", () => {
      const original = new Message(testData, testType, testMetadata);
      const json = JSON.stringify(original.toJSON());
      const recreated = Message.fromJSON(json);

      expect(recreated).toBeInstanceOf(Message);
      expect(recreated.id).toBe(original.id);
      expect(recreated.timestamp).toBe(original.timestamp);
      expect(recreated.type).toBe(original.type);
      expect(recreated.data).toEqual(original.data);
    });

    it("should generate new ID and timestamp if missing", () => {
      const incomplete = {
        type: "test",
        data: { something: "here" },
      };

      const message = Message.fromJSON(incomplete);

      expect(message).toBeInstanceOf(Message);
      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeDefined();
      expect(message.type).toBe("test");
      expect(message.data).toEqual({ something: "here" });
    });
  });
});
