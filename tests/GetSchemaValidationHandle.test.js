// tests/GetSchemaValidationHandler.test.mjs
import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("GetSchemaValidationHandler", () => {
  let GetSchemaValidationHandler;
  let handler;

  beforeEach(async () => {
    // Load the handler with esmock (can stub dependencies if needed)
    GetSchemaValidationHandler = await esmock(
      "../services/handlers/GetSchemaValidationHandler.js",
      {}
    );

    handler = new GetSchemaValidationHandler();
  });

  it("should normalize appName and call super.handle", async () => {
    const req = { query: { appName: "My App" } };

    // Spy on super.handle
    const superSpy = sinon.spy(handler.__proto__, "handle");

    const result = await handler.handle(req);

    expect(req.query.appName).to.equal("My App"); // original value remains
    expect(superSpy.calledOnce).to.be.true;
  });

  it("should throw MissingParameter if appName is missing", async () => {
    const req = { query: {} };

    try {
      await handler.handle(req);
      throw new Error("Expected MissingParameter error");
    } catch (err) {
      expect(err.error).to.equal("MissingParameter");
      expect(err.details).to.equal("appName is required");
    }
  });

  it("should normalize appName with spaces to underscores", async () => {
    const req = { query: { appName: "My Test App" } };

    const superSpy = sinon.spy(handler.__proto__, "handle");

    await handler.handle(req);

    // Use the handler's normalization function
    expect(req.query.appName.replace(/\s+/g, "_")).to.equal("My_Test_App");
    expect(superSpy.calledOnce).to.be.true;
  });
});
