// tests/UpdateSchemaHandler.test.js
import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("UpdateSchemaHandler", () => {
  let UpdateSchemaHandler;
  let handler;
  let fsStub;
  let dbStub;

  beforeEach(async () => {
    // --- Stub fs ---
    fsStub = {
      existsSync: sinon.stub().returns(true),
      mkdirSync: sinon.stub(),
      writeFileSync: sinon.stub(),
      unlinkSync: sinon.stub(),
    };

    // --- Stub DB ---
    dbStub = {
      get: sinon.stub(),
      run: sinon.stub(),
      close: sinon.stub(),
    };

    // --- esmock to replace fs + getDBConnection ---
    UpdateSchemaHandler = await esmock(
      "../services/handlers/UpdateSchemaHandler.js",
      {
        fs: fsStub,
        "../database/connection.js": {
          getDBConnection: async () => dbStub,
        },
      }
    );

    handler = new UpdateSchemaHandler();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should update file and DB successfully", async () => {
    const req = {
      appName: "testApp",
      app_version: "1.0",
      file: { originalname: "schema.json", buffer: Buffer.from("{}") },
    };

    // Stub DB responses
    dbStub.get.withArgs(sinon.match.any, ["testApp", "1.0"]).resolves({ id: 1 });
    dbStub.get.withArgs(sinon.match.any, [1]).resolves({
      id: 1,
      app_name: "testApp",
      app_version: "1.0",
      file_path: "database/uploads/testApp/v1.0.json",
      created_at: new Date().toISOString(),
    });

    dbStub.run.resolves({ changes: 1 });

    const result = await handler.handle(req);

    expect(fsStub.writeFileSync.calledOnce).to.be.true;
    expect(dbStub.run.calledOnce).to.be.true;
    expect(result.savedRecord).to.have.property("file_path");
  });

  it("should throw AppVersionNotFound if DB record does not exist", async () => {
    const req = { appName: "testApp", app_version: "1.0", file: { originalname: "schema.json", buffer: Buffer.from("{}") } };
    dbStub.get.resolves(null);

    try {
      await handler.handle(req);
      throw new Error("Expected AppVersionNotFound");
    } catch (err) {
      expect(err.error).to.equal("AppVersionNotFound"); 
      expect(err.details).to.include("No existing record found");
    }
  });

  it("should rollback file if DB update fails", async () => {
    const req = {
      appName: "testApp",
      app_version: "1.0",
      file: { originalname: "schema.json", buffer: Buffer.from("{}") },
    };

    dbStub.get.withArgs(sinon.match.any, ["testApp", "1.0"]).resolves({ id: 1 });
    dbStub.run.rejects(new Error("DB failure"));

    try {
      await handler.handle(req);
      throw new Error("Expected FileUpdateRollback");
    } catch (err) {
      expect(fsStub.unlinkSync.calledOnce).to.be.true;
      expect(err.error).to.equal("FileUpdateRollback"); 
      expect(err.details).to.include("DB update failed");
    }
  });
});
