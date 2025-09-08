// schemaService.js
import { SchemasQueries } from "../database/sqlQueries.js";

/**
 * Insert a new schema record
 * @param {object} db - DB connection instance
 * @param {string} appName
 * @param {string} appVersion
 * @param {string} filePath
 * @returns {Promise<object>} result of insertion
 */
export async function insertSchema(db, appName, appVersion, filePath) {
  return db.run(SchemasQueries.insertSchema, [appName, appVersion, filePath]);
}

/**
 * Get schema by appName + appVersion
 */
export async function getSchemaByAppVersion(db, appName, appVersion) {
  return db.get(SchemasQueries.getByAppVersion, [appName, appVersion]);
}

/**
 * Get schema by ID
 */
export async function getSchemaById(db, id) {
  return db.get(SchemasQueries.getById, [id]);
}

/**
 * Get all schemas for an app
 */
export async function getSchemasByAppName(db, appName) {
  return db.all(SchemasQueries.getByAppName, [appName]);
}

/**
 * Get latest app_version for an app
 */
export async function getMaxAppVersion(db, appName) {
  return db.get(SchemasQueries.getMaxAppVersion, [appName]);
}

/**
 * Update file path and timestamp by schema ID
 */
export async function updateFilePathById(db, filePath, id) {
  return db.run(SchemasQueries.updateFilePathById, [filePath, id]);
}

/**
 * Update only timestamp by schema ID
 */
export async function updateTimestampById(db, id) {
  return db.run(SchemasQueries.updateTimestampById, [id]);
}
