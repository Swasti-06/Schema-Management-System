// 1️⃣ Mock modules BEFORE importing
import { jest } from "@jest/globals";

jest.unstable_mockModule("../database/connection.js", () => ({
  getDBConnection: jest.fn(),
}));

jest.unstable_mockModule("fs", () => ({
  existsSync: jest.fn(),
}));

jest.unstable_mockModule("../services/handlers/ExceptionHandler.js", () => ({
  default: { handle: jest.fn((err) => err) },
}));

// 2️⃣ Import after mocks
const { getDBConnection } = await import("../database/connection.js");
const fs = await import("fs");
import ValidateExistingSchemaHandler from "../services/handlers/ValidateExistingSchemaHandler.js";
import { SchemasQueries } from "../database/sqlQueries.js";

// 3️⃣ Tests
describe("ValidateExistingSchemaHandler", () => {
  let handler;
  let mockDb;

  beforeEach(() => {
    handler = new ValidateExistingSchemaHandler();

    // Reset mocks
    jest.resetAllMocks();

    // Fake DB
    mockDb = {
      get: jest.fn(),
      close: jest.fn(),
    };
    getDBConnection.mockResolvedValue(mockDb);

    // Default fs mock
    fs.existsSync.mockReturnValue(true);
  });

  it("should validate existing schema successfully", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };
    const dbRecord = { id: 1, app_name: "TestApp", app_version: "1.0.0" };
    mockDb.get.mockResolvedValue(dbRecord);

    const result = await handler.handle(req);

    expect(mockDb.get).toHaveBeenCalledWith(SchemasQueries.getByAppVersion, ["TestApp", "1.0.0"]);
    expect(mockDb.close).toHaveBeenCalled();
    expect(fs.existsSync).toHaveBeenCalled();

    expect(req.existingRecord).toEqual(dbRecord);
    expect(req.filePath).toBeDefined();
  });

  it("should return AppVersionNotFound if DB record missing", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };
    mockDb.get.mockResolvedValue(null);

    const result = await handler.handle(req);

    expect(result).toEqual({
      error: "AppVersionNotFound",
      details: "App version 1.0.0 for app TestApp does not exist in DB",
    });
  });

  it("should return FileMissing if file does not exist", async () => {
    const req = { appName: "TestApp", app_version: "1.0.0" };
    const dbRecord = { id: 1, app_name: "TestApp", app_version: "1.0.0" };
    mockDb.get.mockResolvedValue(dbRecord);
    fs.existsSync.mockReturnValue(false);

    const result = await handler.handle(req);

    expect(result).toEqual({
      error: "FileMissing",
      details: "File for app version 1.0.0 is missing in uploads folder",
    });
  });
});
