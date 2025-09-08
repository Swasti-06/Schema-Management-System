// --- Mock modules BEFORE importing ---
jest.mock('../database/connection.js', () => ({
  getDBConnection: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

jest.mock('../services/handlers/ExceptionHandler.js', () => ({
  default: {
    handle: jest.fn(err => { throw err; }), // throws to support .rejects
  },
}));

// --- Import after mocks ---
import { getDBConnection } from '../database/connection.js';
import fs from 'fs/promises';
import ExceptionHandler from '../services/handlers/ExceptionHandler.js';
import FetchSchemaHandler from '../services/handlers/FetchSchemaHandler.js';
import  { SchemasQueries } from '../database/sqlQueries.js';


describe('FetchSchemaHandler', () => {
  let handler;
  let mockDb;

  beforeEach(() => {
    handler = new FetchSchemaHandler();
    jest.resetAllMocks();

    mockDb = {
      get: jest.fn(),
      all: jest.fn(),
      close: jest.fn(),
    };
    getDBConnection.mockResolvedValue(mockDb);
  });

  it('should fetch specific version successfully', async () => {
    const req = { query: { appName: 'TestApp', version: '1.0.0' } };
    const row = { id: 1, app_name: 'TestApp', app_version: '1.0.0', file_path: 'schema.json', created_at: '2025-09-08' };

    mockDb.get.mockResolvedValueOnce(row);
    fs.readFile.mockResolvedValueOnce('file-content');

    // Spy on super.handle
    const superHandleSpy = jest.spyOn(Object.getPrototypeOf(handler), 'handle');

    const result = await handler.handle(req);

    expect(mockDb.get).toHaveBeenCalledWith(SchemasQueries.getByAppVersion, ['TestApp', '1.0.0']);
    expect(fs.readFile).toHaveBeenCalledWith('schema.json', 'utf-8');
    expect(req.schemaRow).toEqual(row);
    expect(req.schemaContent).toEqual('file-content');
    expect(superHandleSpy).toHaveBeenCalledWith(req);
    expect(result).toEqual(req);
  });

//   it('should fetch latest version if version not provided', async () => {
//   const req = { query: { appName: 'TestApp' } };

//   const rows = [
//     { id: 1, app_name: 'TestApp', app_version: '0.9.0', file_path: 'old.json', created_at: '2025-01-01' },
//     { id: 2, app_name: 'TestApp', app_version: '1.0.0', file_path: 'latest.json', created_at: '2025-09-08' }
//   ];

//   // Mock DB.all to return multiple rows
//   mockDb.all.mockResolvedValueOnce(rows);

//   // Mock fs.readFile for the latest row
//   fs.readFile.mockResolvedValueOnce('latest-content');

//   // Spy on super.handle
//   const superHandleSpy = jest.spyOn(Object.getPrototypeOf(handler), 'handle');

//   const result = await handler.handle(req);

//   expect(mockDb.all).toHaveBeenCalledWith(SchemasQueries.getByAppName, ['TestApp']);
//   expect(req.schemaRow.file_path).toBe('latest.json');
//   expect(req.schemaContent).toBe('latest-content');
//   expect(superHandleSpy).toHaveBeenCalledWith(req);
//   expect(result).toEqual(req);
// });

it('should throw MissingParameter error if appName is missing', async () => {
    const req = { query: {} };

    await expect(handler.handle(req)).resolves.toEqual({
        error: 'MissingParameter',
        details: 'appName is required',
        });


    expect(ExceptionHandler.handle).toHaveBeenCalledWith({
      error: 'MissingParameter',
      details: 'appName is required',
    });
  });


//   it('should throw AppVersionNotFound if specific version does not exist', async () => {
//     const req = { query: { appName: 'TestApp', version: '1.0.0' } };
//     mockDb.get.mockResolvedValueOnce(null);

//     await expect(handler.handle(req)).rejects.toEqual({
//       error: 'AppVersionNotFound',
//       details: 'Schema for TestApp with app_version 1.0.0 not found',
//     });
//   });

//   it('should throw NotFound if no schemas exist for app', async () => {
//     const req = { query: { appName: 'TestApp' } };
//     mockDb.all.mockResolvedValueOnce([]);

//     await expect(handler.handle(req)).rejects.toEqual({
//       error: 'NotFound',
//       details: 'No schema found for TestApp',
//     });
//   });

//   it('should throw FileError if file read fails', async () => {
//     const req = { query: { appName: 'TestApp', version: '1.0.0' } };
//     const row = { id: 1, app_name: 'TestApp', app_version: '1.0.0', file_path: 'missing.json', created_at: '2025-09-08' };
//     mockDb.get.mockResolvedValueOnce(row);
//     fs.readFile.mockRejectedValueOnce(new Error('file missing'));

//     await expect(handler.handle(req)).rejects.toEqual({
//       error: 'FileError',
//       details: 'Could not read schema file at missing.json',
//     });
//   });

//   it('should close DB connection even if error occurs', async () => {
//     const req = { query: { appName: 'TestApp', version: '1.0.0' } };
//     mockDb.get.mockRejectedValueOnce(new Error('DB error'));

//     await expect(handler.handle(req)).rejects.toEqual({
//       status: 500,
//       error: 'InternalServerError',
//       details: 'DB error',
//     });

//     expect(mockDb.close).toHaveBeenCalled();
//   });
});
