export const SchemasQueries = {
  // --- Insert new schema ---
  insertSchema: `
    INSERT INTO schemas (app_name, app_version, file_path)
    VALUES (?, ?, ?)
  `,

  // --- Get schema by app_name + app_version ---
  getByAppVersion: `
    SELECT * FROM schemas
    WHERE app_name = ? AND app_version = ?
  `,

  // --- Get schema by id ---
  getById: `
    SELECT * FROM schemas
    WHERE id = ?
  `,

  // --- Get all schemas for an app ---
  getByAppName: `
    SELECT * FROM schemas
    WHERE app_name = ?
  `,

  // --- Get latest app_version for an app ---
  getMaxAppVersion: `
    SELECT MAX(app_version) AS app_version
    FROM schemas
    WHERE app_name = ?
  `,

  // --- Update schema file_path + timestamp ---
  updateFilePathById: `
    UPDATE schemas
    SET file_path = ?, created_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,

  // --- Update only timestamp ---
  updateTimestampById: `
    UPDATE schemas
    SET created_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
};
