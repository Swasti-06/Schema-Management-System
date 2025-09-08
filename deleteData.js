import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function clearSchemasTable() {
  const db = await open({
    filename: "./database/sqlite.db",
    driver: sqlite3.Database
  });

  await db.exec("DELETE FROM schemas;");
  await db.exec("DELETE FROM sqlite_sequence WHERE name='schemas';"); // reset autoincrement

  await db.close();
  console.log("All rows deleted and AUTOINCREMENT reset.");
}

clearSchemasTable();
