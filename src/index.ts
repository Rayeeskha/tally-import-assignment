import dotenv from "dotenv";
import Database from "./database";
import { Application } from "express";
import Routes from "./route/index";
// import { connectRedis } from "./config/redis";

dotenv.config();

export default class Server {
  async initialize(app: Application): Promise<void> {
    try {
      console.log("Initializing server...");

      const database = Database.getInstance();
      console.log("Connecting to database...");
      await database.initialize();

      //   await connectRedis();

      console.log("Database connected successfully");

      new Routes(app);
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }
}
