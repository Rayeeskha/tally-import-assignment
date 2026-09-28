import mysql, { Pool, PoolOptions } from "mysql2/promise";

export function mysqlOptions(database?: string): PoolOptions {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    ...(database ? { database } : {}),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_MAX || 10),
    queueLimit: 0,
    charset: "utf8mb4",
  };
}

export function createMysqlPool(database?: string): Pool {
  return mysql.createPool(mysqlOptions(database));
}

export function databaseName(): string {
  const name = process.env.DB_SCHEMA || "tally";
  if (!/^[A-Za-z0-9_$]+$/.test(name)) throw new Error("DB_SCHEMA contains unsupported characters");
  return name;
}
