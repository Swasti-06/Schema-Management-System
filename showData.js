import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function clearSchemasTable() {
  const db = await open({
    filename: "./database/sqlite.db",
    driver: sqlite3.Database
  });

  // Fetch all rows
  const rows = await db.all("SELECT * FROM schemas;");

  console.log("Current rows in schemas table:");
  console.table(rows);

  await db.close();
}

clearSchemasTable();
