// --- Mock modules BEFORE importing ---
jest.mock('../services/handlers/ExceptionHandler.js');

// --- Import AFTER mocks ---
import ExceptionHandler from '../services/handlers/ExceptionHandler.js';
import GetSchemaValidationHandler from '../services/handlers/GetSchemaValidationHandler.js';

describe('GetSchemaValidationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new GetSchemaValidationHandler();

    // Reset all mocks
    jest.resetAllMocks();

    // Spy on the static handle method of ExceptionHandler
    jest.spyOn(ExceptionHandler, 'handle').mockImplementation(err => err);
  });

  it('should call super.handle when appName is provided', async () => {
    const req = { query: { appName: 'TestApp', info: { description: 'Test App' } } };

    // Spy on super.handle (BaseHandler)
    const superHandleSpy = jest.spyOn(Object.getPrototypeOf(handler), 'handle');

    const result = await handler.handle(req);

    expect(superHandleSpy).toHaveBeenCalledWith(req);
    expect(result).toEqual(req); // super.handle returns req
  });

  
});


