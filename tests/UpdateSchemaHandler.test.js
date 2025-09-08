// --- Mock modules BEFORE importing ---
jest.mock('../database/connection.js', () => ({
  getDBConnection: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

jest.mock('../services/handlers/ExceptionHandler.js', () => ({
  handle: jest.fn(err => err),
}));


// --- Import after mocks ---
const { getDBConnection } = require('../database/connection.js');
const fs = require('fs');
const ExceptionHandler = require('../services/handlers/ExceptionHandler.js');
const UpdateSchemaHandler = require('../services/handlers/UpdateSchemaHandler.js').default;
const { SchemasQueries } = require('../database/sqlQueries.js');
const path = require('path');

describe('UpdateSchemaHandler', () => {
  let handler;
  let mockDb;

  beforeEach(() => {
    handler = new UpdateSchemaHandler();
    jest.resetAllMocks();

    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
      close: jest.fn(),
    };
    getDBConnection.mockResolvedValue(mockDb);

    fs.existsSync.mockReturnValue(true);
    fs.mkdirSync.mockImplementation(() => {});
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
    ExceptionHandler.handle.mockImplementation(err => err);
  });

  

it('should update file successfully and DB record', async () => {
  const req = {
    appName: 'TestApp',
    app_version: '1.0.0',
    file: { originalname: 'schema.json', buffer: 'test-buffer' },
  };

  const dbRecord = { id: 1, app_name: 'TestApp', app_version: '1.0.0' };
  mockDb.get
    .mockResolvedValueOnce(dbRecord) // check existing
    .mockResolvedValueOnce({ ...dbRecord, file_path: path.join('database', 'uploads', 'TestApp', 'v1.0.0.json') }); // fetch saved

  const result = await handler.handle(req);

  const expectedFilePath = path.join('database', 'uploads', 'TestApp', 'v1.0.0.json');

  expect(mockDb.get).toHaveBeenCalledWith(SchemasQueries.getByAppVersion, ['TestApp', '1.0.0']);
  expect(fs.writeFileSync).toHaveBeenCalled();
  expect(mockDb.run).toHaveBeenCalledWith(SchemasQueries.updateFilePathById, [expectedFilePath, 1]);
  expect(fs.existsSync).toHaveBeenCalled();
  expect(req.savedRecord).toBeDefined();
  expect(result).toBeDefined();
});


  it('should rollback file if DB update fails', async () => {
    const req = {
      appName: 'TestApp',
      app_version: '1.0.0',
      file: { originalname: 'schema.json', buffer: 'test-buffer' },
    };

    const dbRecord = { id: 1, app_name: 'TestApp', app_version: '1.0.0' };
    mockDb.get.mockResolvedValueOnce(dbRecord); // check existing
    mockDb.run.mockRejectedValueOnce(new Error('DB error'));

    await expect(handler.handle(req)).rejects.toEqual({
      error: 'FileUpdateRollback',
      details: expect.stringContaining('DB update failed, rolled back file upload'),
    });

    expect(fs.unlinkSync).toHaveBeenCalled(); // rollback triggered
  });

  it('should throw AppVersionNotFound if record does not exist', async () => {
  const req = {
    appName: 'TestApp',
    app_version: '1.0.0',
    file: { originalname: 'schema.json', buffer: 'test' },
  };
  mockDb.get.mockResolvedValueOnce(null);

  await expect(handler.handle(req)).rejects.toEqual({
    error: 'AppVersionNotFound',
    details: 'No existing record found for app_version 1.0.0',
  });
});

});
