import { jest } from "@jest/globals";

// --- mock before imports ---
jest.unstable_mockModule("sqlite3", () => ({ Database: jest.fn() }));
jest.unstable_mockModule("sqlite", () => ({ open: jest.fn() }));
jest.unstable_mockModule("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
jest.unstable_mockModule("path", () => ({
  join: jest.fn(),
  resolve: jest.fn(),
}));
jest.unstable_mockModule("../database/connection.js", () => ({
  getDBConnection: jest.fn(),
}));
jest.unstable_mockModule("../utils/normalizeVersions.js", () => ({
  normalizeVersion: jest.fn(),
}));
jest.unstable_mockModule("../services/handlers/ExceptionHandler.js", () => ({
  default: { handle: jest.fn() },
}));

// --- now import modules AFTER mocks ---
const { default: SaveSchemaHandler } = await import(
  "../services/handlers/SaveSchemaHandler.js"
);
const fs = await import("fs");
const path = await import("path");
const { getDBConnection } = await import("../database/connection.js");
const { normalizeVersion } = await import("../utils/normalizeVersions.js");
const { default: ExceptionHandler } = await import(
  "../services/handlers/ExceptionHandler.js"
);
const { SchemasQueries } = await import("../database/sqlQueries.js");

describe("SaveSchemaHandler", () => {
  let handler, mockDb;

  beforeEach(() => {
    handler = new SaveSchemaHandler();

    // reset mocks
    jest.resetAllMocks();

    // fake db
    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
      close: jest.fn(),
    };
    getDBConnection.mockResolvedValue(mockDb);

    // default mocks
    path.join.mockImplementation((...args) => args.join("/"));
    path.resolve.mockImplementation((p) => `/abs/${p}`);
    fs.existsSync.mockReturnValue(false);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    normalizeVersion.mockImplementation((v) => v);
    ExceptionHandler.handle.mockImplementation((e) => e);
  });

  it("should handle a new upload successfully", async () => {
    const req = {
      appName: "myApp",
      app_version: "1.0.0",
      file: { originalname: "schema.json", buffer: "test-buffer" },
    };

    mockDb.get
      .mockResolvedValueOnce(null) // no existing version
      .mockResolvedValueOnce({ id: 1, appName: "myApp", app_version: "1.0.0" }); // saved record
    mockDb.run.mockResolvedValue({ lastID: 1 });

    const result = await handler.handle(req);

    expect(normalizeVersion).toHaveBeenCalledWith("1.0.0");
    expect(fs.existsSync).toHaveBeenCalledWith("/abs/database/uploads/myApp");
    expect(fs.mkdirSync).toHaveBeenCalledWith("/abs/database/uploads/myApp", { recursive: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/abs/database/uploads/myApp/v1.0.0.json",
      "test-buffer",
      "utf8"
    );

    expect(mockDb.run).toHaveBeenCalledWith(SchemasQueries.insertSchema, [
      "myApp",
      "1.0.0",
      "database/uploads/myApp/v1.0.0.json",
    ]);
    expect(req.savedRecord).toEqual({ id: 1, appName: "myApp", app_version: "1.0.0" });
    expect(result).toBeDefined();
  });

  it("should throw error if duplicate app version exists", async () => {
    const req = {
      appName: "myApp",
      app_version: "1.0.0",
      file: { originalname: "schema.json", buffer: "test-buffer" },
    };

    mockDb.get.mockResolvedValueOnce({ id: 99 }); // simulate duplicate
    ExceptionHandler.handle.mockImplementation((e) => e);

    await expect(handler.handle(req)).rejects.toEqual({
      error: "DuplicateAppVersion",
      details: "Version 1.0.0 already exists for app myApp",
    });
  });

  it("should save file with .yaml extension if original file is yaml", async () => {
    const req = {
      appName: "myApp",
      app_version: "2.0.0",
      file: { originalname: "schema.yaml", buffer: "test-buffer" },
    };

    mockDb.get
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2, appName: "myApp", app_version: "2.0.0" });
    mockDb.run.mockResolvedValue({ lastID: 2 });

    await handler.handle(req);

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      "/abs/database/uploads/myApp/v2.0.0.yaml",
      "test-buffer",
      "utf8"
    );
  });

  it("should call ExceptionHandler on unexpected error", async () => {
    const req = {
      appName: "myApp",
      app_version: "1.0.0",
      file: { originalname: "schema.json", buffer: "test-buffer" },
    };

    mockDb.get.mockRejectedValueOnce(new Error("DB crashed"));
    ExceptionHandler.handle.mockReturnValue(new Error("Handled"));

    await expect(handler.handle(req)).rejects.toThrow("Handled");
    expect(ExceptionHandler.handle).toHaveBeenCalled();
  });
});
