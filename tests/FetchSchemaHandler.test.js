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


});
