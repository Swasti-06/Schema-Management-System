import Handler from "./BaseHandler.js";
import ExceptionHandler from "./ExceptionHandler.js";

export default class FileValidationHandler extends Handler {
  async handle(req) {
    try {
      if (!req.file || !req.file.buffer) {
        throw {
          error: "FileMissing",
          details: "No file uploaded in request",
        };
      }

      return super.handle(req);

    } catch (err) {
      // Throw the structured error object so Express sees it
      const formatted = ExceptionHandler.handle(err);
      throw formatted;
    }
  }
}
