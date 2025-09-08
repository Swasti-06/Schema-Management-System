// tests/FileValidationHandler.test.js
import { expect } from "chai";
import FileValidationHandler from "../services/handlers/FileValidationHandler.js";

// --- Mock Handler superclass ---
class MockHandler {
  async handle(req) {
    return "nextHandlerCalled";
  }
}

// Patch FileValidationHandler to extend the mock handler
Object.setPrototypeOf(FileValidationHandler.prototype, MockHandler.prototype);

describe("FileValidationHandler", function () {
  it("should pass through if file is provided", async function () {
    const handler = new FileValidationHandler();
    const req = {
      file: { buffer: Buffer.from("dummy content") },
    };

    const result = await handler.handle(req);
    expect(result).to.equal("nextHandlerCalled"); // super.handle called
  });

  it("should throw error if no file is attached", async function () {
    const handler = new FileValidationHandler();
    const req = {}; // no file

    try {
      await handler.handle(req);
      throw new Error("Expected handler to throw, but it did not");
    } catch (err) {
      expect(err).to.include({
        status: 400,
        error: "FileMissing",
        details: "No file uploaded in request",
      });
    }
  });

  it("should throw error if file.buffer is missing", async function () {
    const handler = new FileValidationHandler();
    const req = { file: {} }; // no buffer

    try {
      await handler.handle(req);
      throw new Error("Expected handler to throw, but it did not");
    } catch (err) {
      expect(err).to.include({
        status: 400,
        error: "FileMissing",
        details: "No file uploaded in request",
      });
    }
  });
});
