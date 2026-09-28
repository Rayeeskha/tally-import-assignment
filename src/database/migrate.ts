import "../config/db-config";
import fs from "node:fs/promises";
import path from "node:path";
import { createMysqlPool, databaseName } from "./mysql";

async function migrate(): Promise<void> {
  const name = databaseName();
  const adminPool = createMysqlPool();
  const appPool = createMysqlPool(name);
  try {
    await adminPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await appPool.execute(
      "CREATE TABLE IF NOT EXISTS schema_migrations (id VARCHAR(255) NOT NULL PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB",
    );
    const migrationsDir = path.join(__dirname, "migrations");
    const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
    for (const file of files) {
      const [applied] = await appPool.execute<any[]>(
        "SELECT id FROM schema_migrations WHERE id = ?",
        [file],
      );
      if (applied.length > 0) continue;
      const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
      const connection = await appPool.getConnection();
      try {
        await connection.beginTransaction();
        for (const statement of sql
          .split(/;\s*/)
          .map((part) => part.trim())
          .filter(Boolean))
          await connection.query(statement);
        await connection.execute("INSERT INTO schema_migrations (id) VALUES (?)", [file]);
        await connection.commit();
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }
    console.log(`MySQL migrations complete for database '${name}'`);
  } finally {
    await adminPool.end();
    await appPool.end();
  }
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
