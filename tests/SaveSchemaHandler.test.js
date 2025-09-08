import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("SaveSchemaHandler", () => {
  let SaveSchemaHandler;
  let fsStub, dbStub, handler;

  beforeEach(async () => {
    // --- fs stub ---
    fsStub = {
      existsSync: sinon.stub().returns(true),
      mkdirSync: sinon.stub(),
      writeFileSync: sinon.stub(),
      unlinkSync: sinon.stub(),
    };

    // --- db stub ---
    dbStub = {
      get: sinon.stub(),
      run: sinon.stub().resolves({ lastID: 1 }),
      close: sinon.stub(),
    };

    // --- esmock to replace fs + db connection ---
    SaveSchemaHandler = await esmock(
      "../services/handlers/SaveSchemaHandler.js",
      {
        fs: fsStub,
        "../database/connection.js": {
          getDBConnection: async () => dbStub,
        },
      }
    );

    handler = new SaveSchemaHandler();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should save schema successfully", async () => {
    const req = {
      appName: "testApp",
      app_version: "1.0",
      file: { originalname: "schema.json", buffer: Buffer.from("{}") },
    };

    // No duplicate version
    dbStub.get.withArgs(sinon.match.any, ["testApp", "1.0"]).resolves(null);

    // Return saved record
    dbStub.get.withArgs(sinon.match.any, [1]).resolves({
      id: 1,
      app_name: "testApp",
      app_version: "1.0",
      file_path: "database/uploads/testApp/v1.0.json",
      created_at: new Date().toISOString(),
    });

    const result = await handler.handle(req);

    expect(result.savedRecord).to.include({
      app_name: "testApp",
      app_version: "1.0",
    });
    expect(fsStub.writeFileSync.calledOnce).to.be.true;
    expect(dbStub.run.calledOnce).to.be.true;
  });

  it("should throw error if version already exists", async () => {
    const req = {
      appName: "testApp",
      app_version: "1.0",
      file: { originalname: "schema.json", buffer: Buffer.from("{}") },
    };

    dbStub.get
      .withArgs(sinon.match.any, ["testApp", "1.0"])
      .resolves({ id: 123 });

    try {
      await handler.handle(req);
      throw new Error("Expected DuplicateAppVersion error");
    } catch (err) {
      expect(err).to.include({
        error: "FileUploadRollback",
      });
    }
  });

  it("should rollback file if DB insertion fails", async () => {
    const req = {
      appName: "testApp",
      app_version: "1.0",
      file: { originalname: "schema.json", buffer: Buffer.from("{}") },
    };

    dbStub.get.withArgs(sinon.match.any, ["testApp", "1.0"]).resolves(null);
    dbStub.run.rejects(new Error("DB failure"));

    try {
      await handler.handle(req);
      throw new Error("Expected FileUploadRollback error");
    } catch (err) {
      expect(fsStub.unlinkSync.calledOnce).to.be.true;
      expect(err.error).to.equal("FileUploadRollback");
    }
  });
});



