import Handler from "./BaseHandler.js";
import fs from "fs";
import path from "path";
import { getDBConnection } from "../../database/connection.js";
import ExceptionHandler from "./ExceptionHandler.js";
import { SchemasQueries } from "../../database/sqlQueries.js";

export default class UpdateSchemaHandler extends Handler {
  async handle(req) {
    let db;
    let absoluteFilePath; 

    try {
      // --- 1. Get DB connection ---
      db = await getDBConnection();

      // --- 2. Validate that app_version exists in DB ---
      const appVersion = req.app_version; 
      const existing = await db.get(SchemasQueries.getByAppVersion, [
        req.appName,
        appVersion,
      ]);

      if (!existing) {
        throw {
          error: "AppVersionNotFound",
          details: `No existing record found for app_version ${appVersion}`,
        };
      }

      req.existingRecord = existing;

      // --- 3. Prepare upload directories ---
      const baseUploadDir = path.join("database", "uploads");
      const relativeUploadDir = path.join(baseUploadDir, req.appName);
      const absoluteUploadDir = path.resolve(relativeUploadDir);

      if (!fs.existsSync(absoluteUploadDir)) {
        fs.mkdirSync(absoluteUploadDir, { recursive: true });
      }

      // --- 4. Determine file extension ---
      let ext = ".json";
      const originalName = req.file.originalname.toLowerCase();
      if (originalName.endsWith(".yaml") || originalName.endsWith(".yml")) ext = ".yaml";

      const fileName = `v${appVersion}${ext}`;
      absoluteFilePath = path.join(absoluteUploadDir, fileName);

      // --- 5. Write file to disk ---
      fs.writeFileSync(absoluteFilePath, req.file.buffer, "utf8");
      req.filePath = path.join(relativeUploadDir, fileName);

      // --- 6. Update DB record with new file path ---
      try {
        await db.run(SchemasQueries.updateFilePathById, [req.filePath, existing.id]);
      } catch (dbErr) {
        // --- Rollback: remove the written file if DB update failed ---
        if (absoluteFilePath && fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
        }
        throw {
          error: "FileUpdateRollback",
          details: `DB update failed, rolled back file upload for version ${appVersion}. Original error: ${dbErr.message}`,
        };
      }

      // --- 7. Fetch and attach updated record ---
      const savedRecord = await db.get(SchemasQueries.getById, [existing.id]);
      req.savedRecord = savedRecord;

      // --- 8. Pass request to next handler ---
      return super.handle(req);

    } catch (err) {
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
