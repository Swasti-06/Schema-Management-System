// tests/ValidateExistingSchemaHandler.test.mjs
import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("ValidateExistingSchemaHandler", () => {
  let ValidateExistingSchemaHandler;
  let dbStub, fsStub, handler;

  beforeEach(async () => {
    // --- Stub fs.existsSync ---
    fsStub = {
      existsSync: sinon.stub(),
    };

    // --- Stub DB ---
    dbStub = {
      get: sinon.stub(),
      close: sinon.stub().resolves(),
    };

    // --- esmock to replace fs + db connection ---
    ValidateExistingSchemaHandler = await esmock(
      "../services/handlers/ValidateExistingSchemaHandler.js",
      {
        fs: fsStub,
        "../database/connection.js": {
          getDBConnection: async () => dbStub,
        },
      }
    );

    handler = new ValidateExistingSchemaHandler();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should pass if DB row exists and file exists", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };

    // DB returns a row
    dbStub.get.resolves({ id: 1, app_name: "TestApp", app_version: "1.0.0" });
    // fs.existsSync returns true for JSON file
    fsStub.existsSync.returns(true);

    // Mock super.handle
    const superHandleSpy = sinon.spy(handler.__proto__, "handle");

    const result = await handler.handle(req);

    expect(req.existingRecord).to.deep.equal({
      id: 1,
      app_name: "TestApp",
      app_version: "1.0.0",
    });
    expect(req.filePath).to.include("v1.0.0.json");
    expect(superHandleSpy.calledOnce).to.be.true;
  });

  it("should throw AppVersionNotFound if DB row does not exist", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };

    dbStub.get.resolves(null);

    try {
      await handler.handle(req);
      throw new Error("Expected AppVersionNotFound");
    } catch (err) {
      expect(err.error).to.equal("AppVersionNotFound");
    }
  });

  it("should throw FileMissing if DB row exists but file does not exist", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };

    dbStub.get.resolves({ id: 1, app_name: "TestApp", app_version: "1.0.0" });
    fsStub.existsSync.returns(false);

    try {
      await handler.handle(req);
      throw new Error("Expected FileMissing");
    } catch (err) {
      expect(err.error).to.equal("FileMissing");
    }
  });
});
