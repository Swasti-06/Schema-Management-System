// tests/FetchSchemaHandler.test.mjs
import { expect } from "chai";
import sinon from "sinon";
import esmock from "esmock";

describe("FetchSchemaHandler", () => {
  let FetchSchemaHandler;
  let handler;
  let fsStub;
  let dbStub;

  beforeEach(async () => {
    // --- Stub fs/promises ---
    fsStub = {
      readFile: sinon.stub(),
    };

    // --- Stub DB connection ---
    dbStub = {
      get: sinon.stub(),
      all: sinon.stub(),
      close: sinon.stub(),
    };

    // --- Load handler via esmock to inject stubs ---
    FetchSchemaHandler = await esmock(
      "../services/handlers/FetchSchemaHandler.js",
      {
        "fs/promises": fsStub,
        "../database/connection.js": {
          getDBConnection: async () => dbStub,
        },
      }
    );

    handler = new FetchSchemaHandler();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("should fetch specific version successfully", async () => {
    const req = { query: { appName: "testApp", version: "1.0" } };
    
    // Stub DB get
    dbStub.get.resolves({
      id: 1,
      app_name: "testApp",
      app_version: "1.0",
      file_path: "database/uploads/testApp/v1.0.json",
      created_at: new Date().toISOString(),
    });

    // Stub file read
    fsStub.readFile.resolves("{ \"dummy\": true }");

    const result = await handler.handle(req);

    expect(req.schemaRow).to.include({ app_name: "testApp", app_version: "1.0" });
    expect(req.schemaContent).to.equal("{ \"dummy\": true }");
  });

  it("should fetch latest version if no version specified", async () => {
    const req = { query: { appName: "testApp" } };

    const rows = [
      { id: 1, app_name: "testApp", app_version: "1.0.0", file_path: "f1.json", created_at: "2025-01-01" },
      { id: 2, app_name: "testApp", app_version: "1.2.0", file_path: "f2.json", created_at: "2025-02-01" },
      { id: 3, app_name: "testApp", app_version: "1.1.5", file_path: "f3.json", created_at: "2025-03-01" },
    ];

    dbStub.all.resolves(rows);
    fsStub.readFile.resolves("{ \"latest\": true }");

    const result = await handler.handle(req);

    expect(req.schemaRow.app_version).to.equal("1.2.0"); // highest version
    expect(req.schemaContent).to.equal("{ \"latest\": true }");
  });

  it("should throw NotFound if no rows for appName", async () => {
    const req = { query: { appName: "missingApp" } };
    dbStub.all.resolves([]);

    try {
      await handler.handle(req);
      throw new Error("Expected NotFound");
    } catch (err) {
      expect(err.error).to.equal("NotFound");
      expect(err.details).to.include("No schema found for missingApp");
    }
  });

  it("should throw FileError if readFile fails", async () => {
    const req = { query: { appName: "testApp", version: "1.0" } };
    dbStub.get.resolves({ file_path: "bad.json", id: 1, app_name: "testApp", app_version: "1.0", created_at: new Date().toISOString() });

    fsStub.readFile.rejects(new Error("disk error"));

    try {
      await handler.handle(req);
      throw new Error("Expected FileError");
    } catch (err) {
      expect(err.error).to.equal("FileError");
      expect(err.details).to.include("Could not read schema file");
    }
  });

  it("should throw MissingParameter if appName is missing", async () => {
    const req = { query: {} };

    try {
      await handler.handle(req);
      throw new Error("Expected MissingParameter");
    } catch (err) {
      expect(err.error).to.equal("MissingParameter");
      expect(err.details).to.equal("appName is required");
    }
  });
});
