import Handler from "./BaseHandler.js";
import fs from "fs";
import path from "path";
import { getDBConnection } from "../../database/connection.js";
import { normalizeVersion } from "../../utils/normalizeVersions.js";
import ExceptionHandler from "./ExceptionHandler.js";
import { SchemasQueries } from "../../database/sqlQueries.js";

export default class SaveSchemaHandler extends Handler {
  async handle(req) {
    let db;
    let absoluteFilePath = null; // 🔹 track file path

    try {
      db = await getDBConnection();

      // --- 1. Normalize version ---
      const appVersion = normalizeVersion(req.app_version);
      req.app_version = appVersion;

      // --- 2. Duplicate check ---
      const existing = await db.get(SchemasQueries.getByAppVersion, [
        req.appName,
        appVersion,
      ]);
      if (existing) {
        throw {
          error: "DuplicateAppVersion",
          details: `Version ${appVersion} already exists for app ${req.appName}`,
        };
      }

      // --- 3. Prepare upload paths ---
      const baseUploadDir = path.join("database", "uploads");
      const relativeUploadDir = path.join(baseUploadDir, req.appName);
      const absoluteUploadDir = path.resolve(relativeUploadDir);

      if (!fs.existsSync(absoluteUploadDir)) {
        fs.mkdirSync(absoluteUploadDir, { recursive: true });
      }

      let ext = ".json";
      const originalName = req.file.originalname.toLowerCase();
      if (originalName.endsWith(".yaml") || originalName.endsWith(".yml")) {
        ext = ".yaml";
      }

      const fileName = `v${appVersion}${ext}`;
      absoluteFilePath = path.join(absoluteUploadDir, fileName);

      // --- 4. Write file ---
      fs.writeFileSync(absoluteFilePath, req.file.buffer, "utf8");
      req.filePath = path.join(relativeUploadDir, fileName);

      // --- 5. Insert DB record ---
      const result = await db.run(SchemasQueries.insertSchema, [
        req.appName,
        appVersion,
        req.filePath,
      ]);

      // --- 6. Fetch saved record ---
      const savedRecord = await db.get(SchemasQueries.getById, [result.lastID]);
      if (!savedRecord) {
        throw new Error("Failed to fetch saved record");
      }

      req.savedRecord = savedRecord;
      return super.handle(req);

    } catch (err) {
      // 🔹 Rollback file if DB part failed
      if (absoluteFilePath && fs.existsSync(absoluteFilePath)) {
        try {
          fs.unlinkSync(absoluteFilePath);
          throw {
            error: "FileUploadRollback",
            details: `File was uploaded but rolled back due to DB error: ${err.message}`,
          };
        } catch (unlinkErr) {
          console.error("Rollback failed: could not delete file", unlinkErr);
        }
      }

      const handledError = ExceptionHandler.handle(err);
      throw handledError;

    } finally {
      if (db) {
        try {
          await db.close();
        } catch (_) {}
      }
    }
  }
}
