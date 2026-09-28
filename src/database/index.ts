import { Sequelize } from "sequelize-typescript";
import { configPromise, dialect } from "../config/db-config";
import User from "../models/user.model";
import TallyImport from "../models/tally_import.model";
import TallyAllocation from "../models/tally_allocation.model";
import TallyInventoryEntry from "../models/tally_inventory.model";
import TallyLedgerEntry from "../models/tally_edger.model";
import TallyVoucher from "../models/tally_voucher.model";

export default class Database {
  private static instance: Database;
  private sequelize: Sequelize | null = null;
  private initialization?: Promise<Sequelize>;

  private constructor() {}

  public static getInstance(): Database {
    Database.instance ??= new Database();
    return Database.instance;
  }

  public static connection(): Sequelize {
    return Database.getInstance().getSequelize();
  }

  public static transaction<T>(
    callback: (transaction: import("sequelize").Transaction) => Promise<T>,
  ): Promise<T> {
    return Database.connection().transaction(callback);
  }

  public getSequelize(): Sequelize {
    if (!this.sequelize) throw new Error("Database has not been initialized");
    return this.sequelize;
  }

  public initialize(): Promise<Sequelize> {
    if (this.initialization) return this.initialization;
    this.initialization = configPromise
      .then(async (config) => {
        this.sequelize = new Sequelize({
          database: config.DB,
          username: config.USER,
          password: config.PASSWORD,
          host: config.HOST,
          dialect,
          pool: {
            max: config.pool.max,
            min: 0,
            acquire: config.pool.acquire,
            idle: config.pool.idle,
          },
          models: [
            User,
            TallyImport,
            TallyAllocation,
            TallyInventoryEntry,
            TallyInventoryEntry,
            TallyLedgerEntry,
            TallyVoucher,
          ],
          logging: process.env.NODE_ENV === "dev" ? console.log : false,
        });
        await this.sequelize.authenticate();
        console.log("Database connection established successfully.");
        return this.sequelize;
      })
      .catch((error: Error) => {
        this.initialization = undefined;
        console.error(`Unable to connect to the database: ${error.message}`);
        throw error;
      });
    return this.initialization;
  }

  public async close(): Promise<void> {
    if (this.sequelize) await this.sequelize.close();
    this.sequelize = null;
    this.initialization = undefined;
  }
}
