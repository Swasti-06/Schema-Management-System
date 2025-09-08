import Handler from "./BaseHandler.js";
import ExceptionHandler from "./ExceptionHandler.js";
import { toSafeFolderName } from "../../utils/normalizeAppName.js";

export default class GetSchemaValidationHandler extends Handler {
  async handle(req) {
    try {
      let { appName } = req.query;

      if (!appName) {
        throw {
          error: "MissingParameter",
          details: "appName is required",
        };
      }

      // Normalize appName → safe for DB and folder names
      appName = toSafeFolderName(appName);


      return super.handle(req);

    } catch (err) {
      throw ExceptionHandler.handle(err);
    }
  }
}
