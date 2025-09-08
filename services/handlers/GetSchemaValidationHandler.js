import Handler from "./BaseHandler.js";
import ExceptionHandler from "./ExceptionHandler.js";

export default class GetSchemaValidationHandler extends Handler {
  async handle(req) {
    try {
      const { appName } = req.query;

      if (!appName) {
        throw {
          error: "MissingParameter",
          details: "appName is required",
        };
      }

      return super.handle(req);

    } catch (err) {
      throw ExceptionHandler.handle(err);
    }
  }
}
