import { getDBConnection } from './connection.js';

export async function ensureSchemaTable() {
  const db = await getDBConnection();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_name TEXT NOT NULL,
      app_version TEXT NOT NULL, 
      file_path TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(app_name, app_version)
    );
  `);

  await db.close();
}
