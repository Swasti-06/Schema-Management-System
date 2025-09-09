import Handler from "./BaseHandler.js";
import { getDBConnection } from "../../database/connection.js";
import { SchemasQueries } from "../../database/sqlQueries.js"; 
import { normalizeVersion } from "../../utils/normalizeVersions.js";
import { toSafeFolderName } from "../../utils/normalizeAppName.js";
import fs from "fs";
import path from "path";
import ExceptionHandler from "./ExceptionHandler.js";

export default class ValidateExistingSchemaHandler extends Handler {
  async handle(req) {
    try {
      let appName = toSafeFolderName(req.appName);
      let appVersion = normalizeVersion(req.app_version);

      const db = await getDBConnection();
      const row = await db.get(SchemasQueries.getByAppVersion, [appName, appVersion]);
      await db.close();

      if (!row) {
        throw {
          error: "AppVersionNotFound",
          details: `App version ${appVersion} for app ${appName} does not exist in DB`
        };
      }

      const uploadsDir = path.resolve("database", "uploads", appName);
      const possibleExts = [".json", ".yaml", ".yml"];
      let filePath;

      for (const ext of possibleExts) {
        const file = path.join(uploadsDir, `v${appVersion}${ext}`);
        if (fs.existsSync(file)) {
          filePath = file;
          break;
        }
      }

      if (!filePath) {
        throw {
          error: "FileMissing",
          details: `File for app version ${appVersion} is missing in uploads folder`
        };
      }

      req.existingRecord = row;
      req.filePath = filePath;

      return super.handle(req);

    } catch (err) {
        throw ExceptionHandler.handle(err);
    }
  }
}
