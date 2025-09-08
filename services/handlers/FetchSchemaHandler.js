// import Handler from "./BaseHandler.js";
// import { getDBConnection } from "../../database/connection.js";
// import fs from "fs/promises";
// import ExceptionHandler from "./ExceptionHandler.js";
// import { SchemasQueries } from "../../database/sqlQueries.js";

// export default class FetchSchemaHandler extends Handler {
//   async handle(req) {
//     let db;

//     try {
//       // --- 1. Extract and validate query params ---
//       const appName = req.query.appName?.trim();
//       const requestedVersion = req.query.version?.trim(); // optional

//       if (!appName) {
//         throw { error: "MissingParameter", details: "appName is required" };
//       }

//       // --- 2. Get DB connection ---
//       db = await getDBConnection();
//       let row;

//       // --- 3. Fetch schema row from DB ---
//       if (requestedVersion) {
//         // Case A: Specific app_version requested
//         row = await db.get(SchemasQueries.getByAppVersion, [appName, requestedVersion]);

//         if (!row) {
//           throw {
//             error: "AppVersionNotFound",
//             details: `Schema for ${appName} with app_version ${requestedVersion} not found`,
//           };
//         }
//       } else {
//         // Case B: No version → fetch all and pick latest
//         const rows = await db.all(SchemasQueries.getByAppName, [appName]);

//         if (!rows || rows.length === 0) {
//           throw {
//             error: "NotFound",
//             details: `No schema found for ${appName}`,
//           };
//         }

//         // Pick the latest schema by created_at timestamp
//         rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//         row = rows[0];
//       }

//       // --- 4. Read schema file content from disk ---
//       let content;
//       try {
//         content = await fs.readFile(row.file_path, "utf-8");
//       } catch (err) {
//         throw {
//           error: "FileError",
//           details: `Could not read schema file at ${row.file_path}`,
//         };
//       }

//       // --- 5. Attach schema data to request ---
//       req.schemaRow = {
//         id: row.id,
//         app_name: row.app_name,
//         app_version: row.app_version,
//         file_path: row.file_path,
//         created_at: row.created_at,
//       };
//       req.schemaContent = content;

//       // --- 6. Pass to next handler ---
//       return super.handle(req);

//     } catch (err) {
//       // --- Error handling ---
//       const handledError = ExceptionHandler.handle(err);
//       throw handledError;

//     } finally {
//       // --- Cleanup: close DB connection ---
//       if (db) {
//         try {
//           await db.close();
//         } catch (_) {}
//       }
//     }
//   }
// }


import Handler from "./BaseHandler.js";
import { getDBConnection } from "../../database/connection.js";
import fs from "fs/promises";
import ExceptionHandler from "./ExceptionHandler.js";
import { SchemasQueries } from "../../database/sqlQueries.js";
import { normalizeVersion, versionToArray } from "../../utils/normalizeVersions.js"; 
import { toSafeFolderName } from "../../utils/normalizeAppName.js";
// 👆 create a utils/versionUtils.js file for version + name helpers

export default class FetchSchemaHandler extends Handler {
  async handle(req) {
    let db;

    try {
      // --- 1. Extract and validate query params ---
      let appName = req.query.appName?.trim();
      let requestedVersion = req.query.version?.trim();

      if (!appName) {
        throw { error: "MissingParameter", details: "appName is required" };
      }

      // Normalize appName → safe for DB and folder names
      appName = toSafeFolderName(appName);

      // Normalize version if provided
      if (requestedVersion) {
        requestedVersion = normalizeVersion(requestedVersion);
      }

      // --- 2. Get DB connection ---
      db = await getDBConnection();
      let row;

      // --- 3. Fetch schema row from DB ---
      if (requestedVersion) {
        // Case A: Specific app_version requested
        row = await db.get(SchemasQueries.getByAppVersion, [appName, requestedVersion]);

        if (!row) {
          throw {
            error: "AppVersionNotFound",
            details: `Schema for ${appName} with app_version ${requestedVersion} not found`,
          };
        }
      } else {
        // Case B: No version → fetch all and pick latest
        const rows = await db.all(SchemasQueries.getByAppName, [appName]);

        if (!rows || rows.length === 0) {
          throw {
            error: "NotFound",
            details: `No schema found for ${appName}`,
          };
        }

        // 🔥 Find highest version instead of latest timestamp
        let latestRow = rows[0];
        let latestVersionArr = versionToArray(normalizeVersion(latestRow.app_version));

        for (const r of rows) {
          const currentVersionArr = versionToArray(normalizeVersion(r.app_version));
          for (let i = 0; i < 3; i++) {
            if (currentVersionArr[i] > latestVersionArr[i]) {
              latestRow = r;
              latestVersionArr = currentVersionArr;
              break;
            } else if (currentVersionArr[i] < latestVersionArr[i]) {
              break; // no need to check further parts
            }
          }
        }

        row = latestRow;
      }

      // --- 4. Read schema file content from disk ---
      let content;
      try {
        content = await fs.readFile(row.file_path, "utf-8");
      } catch (err) {
        throw {
          error: "FileError",
          details: `Could not read schema file at ${row.file_path}`,
        };
      }

      // --- 5. Attach schema data to request ---
      req.schemaRow = {
        id: row.id,
        app_name: row.app_name,
        app_version: row.app_version,
        file_path: row.file_path,
        created_at: row.created_at,
      };
      req.schemaContent = content;

      // --- 6. Pass to next handler ---
      return super.handle(req);

    } catch (err) {
      // --- Error handling ---
      const handledError = ExceptionHandler.handle(err);
      throw handledError;

    } finally {
      // --- Cleanup: close DB connection ---
      if (db) {
        try {
          await db.close();
        } catch (_) {}
      }
    }
  }
}
