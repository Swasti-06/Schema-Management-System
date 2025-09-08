// tests/ParseSpecHandler.test.mjs
import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("ParseSpecHandler", () => {
  let ParseSpecHandler;
  let handler;

  beforeEach(async () => {
    // --- esmock to replace ExceptionHandler if needed ---
    ParseSpecHandler = await esmock(
      "../services/handlers/ParseSpecHandler.js",
      {}
    );

    handler = new ParseSpecHandler();
  });

  it("should parse valid JSON file successfully", async () => {
    const req = {
      file: {
        buffer: Buffer.from(
          JSON.stringify({
            info: { title: "Test App", version: "1.0.0" },
          })
        ),
      },
    };

    // Spy on super.handle
    const superSpy = sinon.spy(handler.__proto__, "handle");

    const result = await handler.handle(req);

    expect(req.parsedSpec).to.be.an("object");
    expect(req.appName).to.equal("Test_App");
    expect(req.app_version).to.equal("1.0.0");
    expect(superSpy.calledOnce).to.be.true;
  });

  it("should parse valid YAML file successfully", async () => {
    const yamlText = `
info:
  title: My YAML App
  version: 2.0.0
`;
    const req = { file: { buffer: Buffer.from(yamlText) } };

    const superSpy = sinon.spy(handler.__proto__, "handle");

    const result = await handler.handle(req);

    expect(req.parsedSpec).to.be.an("object");
    expect(req.appName).to.equal("My_YAML_App");
    expect(req.app_version).to.equal("2.0.0");
    expect(superSpy.calledOnce).to.be.true;
  });

  it("should throw InvalidFile if content is neither valid JSON nor YAML", async () => {
    const req = { file: { buffer: Buffer.from("not json nor yaml") } };

    try {
      await handler.handle(req);
      throw new Error("Expected InvalidFile error");
    } catch (err) {
      expect(err.error).to.equal("InvalidSpec");
    }
  });

  it("should throw InvalidSpec if info.title is missing", async () => {
    const req = {
      file: {
        buffer: Buffer.from(JSON.stringify({ info: { version: "1.0.0" } })),
      },
    };

    try {
      await handler.handle(req);
      throw new Error("Expected InvalidSpec error");
    } catch (err) {
      expect(err.error).to.equal("InvalidSpec");
    }
  });

  it("should throw MissingAppVersion if info.version is missing", async () => {
    const req = {
      file: {
        buffer: Buffer.from(JSON.stringify({ info: { title: "App" } })),
      },
    };

    try {
      await handler.handle(req);
      throw new Error("Expected MissingAppVersion error");
    } catch (err) {
      expect(err.error).to.equal("MissingAppVersion");
    }
  });
});
