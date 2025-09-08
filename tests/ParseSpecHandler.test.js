// tests/ParseSpecHandler.test.mjs
import ParseSpecHandler from "../services/handlers/ParseSpecHandler.js";

// --- Mock Handler superclass ---
class MockHandler {
  async handle(req) {
    return "nextHandlerCalled";
  }
}

// Patch ParseSpecHandler to extend the mock handler
ParseSpecHandler.prototype.__proto__ = MockHandler.prototype;



describe("ParseSpecHandler", () => {

  it("should pass valid JSON with info.title and info.version", async () => {
    const handler = new ParseSpecHandler();
    const req = {
      file: {
        buffer: Buffer.from(JSON.stringify({
          info: { title: "TestApp", version: "1.0.0" }
        }))
      }
    };

    const result = await handler.handle(req);
    expect(result).toBe("nextHandlerCalled");
    expect(req.parsedSpec.info.title).toBe("TestApp");
    expect(req.appName).toBe("TestApp");
    expect(req.app_version).toBe("1.0.0");
  });

  it("should pass valid YAML with info.title and info.version", async () => {
    const handler = new ParseSpecHandler();
    const req = {
      file: {
        buffer: Buffer.from(`
info:
  title: MyApp
  version: 2.0.0
        `)
      }
    };

    const result = await handler.handle(req);
    expect(result).toBe("nextHandlerCalled");
    expect(req.appName).toBe("MyApp");
    expect(req.app_version).toBe("2.0.0");
  });

  it("should throw InvalidFile for malformed JSON/YAML", async () => {
    const handler = new ParseSpecHandler();
    const req = {
      file: { buffer: Buffer.from("invalid json") }
    };

    await expect(handler.handle(req)).rejects.toMatchObject({
      status: 400,
      error: "InvalidSpec"
    });
  });

  it("should throw InvalidSpec if info.title is missing", async () => {
    const handler = new ParseSpecHandler();
    const req = {
      file: { buffer: Buffer.from(JSON.stringify({ info: { version: "1.0.0" } })) }
    };

    await expect(handler.handle(req)).rejects.toMatchObject({
      status: 400,
      error: "InvalidSpec",
      details: "Missing 'info.title' in the file"
    });
  });

  it("should throw MissingAppVersion if info.version is missing", async () => {
    const handler = new ParseSpecHandler();
    const req = {
      file: { buffer: Buffer.from(JSON.stringify({ info: { title: "App1" } })) }
    };

    await expect(handler.handle(req)).rejects.toMatchObject({
      status: 400,
      error: "MissingAppVersion",
      details: "info.version is required and cannot be empty"
    });
  });

});
