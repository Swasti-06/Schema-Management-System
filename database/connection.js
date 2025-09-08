import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Opens SQLite database (creates file if it doesn’t exist)
export async function getDBConnection() {
  return open({
    filename: './database/sqlite.db',
    driver: sqlite3.Database
  });
}

