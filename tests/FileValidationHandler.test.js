// tests/FileValidationHandler.test.mjs
import { jest } from "@jest/globals";
import FileValidationHandler from "../services/handlers/FileValidationHandler.js";

// --- Mock Handler superclass ---
class MockHandler {
  async handle(req) {
    return "nextHandlerCalled";
  }
}

// Patch FileValidationHandler to extend the mock handler
FileValidationHandler.prototype.__proto__ = MockHandler.prototype;




describe("FileValidationHandler", () => {

  it("should pass through if file is provided", async () => {
    const handler = new FileValidationHandler();
    const req = {
      file: { buffer: Buffer.from("dummy content") },
    };

    const result = await handler.handle(req);
    expect(result).toBe("nextHandlerCalled"); // super.handle called
  });

  it("should throw error if no file is attached", async () => {
    const handler = new FileValidationHandler();
    const req = {}; // no file

    await expect(handler.handle(req)).rejects.toMatchObject({
      status: 400,
      error: "FileMissing",
      details: "No file uploaded in request",
    });
  });

  it("should throw error if file.buffer is missing", async () => {
    const handler = new FileValidationHandler();
    const req = { file: {} }; // no buffer

    await expect(handler.handle(req)).rejects.toMatchObject({
      status: 400,
      error: "FileMissing",
      details: "No file uploaded in request",
    });
  });

});
