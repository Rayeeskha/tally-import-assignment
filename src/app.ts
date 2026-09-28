console.log("🔥 app.ts started");
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import compression from "compression";
import Server from "./index";
import { errorMiddleware } from "./middleware/global.error.middleware";
import SwaggerUI from "swagger-ui-express";
import swaggerOutput from "./swagger.json";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const serverIP = process.env.SERVER_IP || "0.0.0.0";
// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(compression());
app.use(morgan("combined"));
console.log("A: app.ts started");
const startServer = async () => {
  try {
    console.log("1. Starting server...");
    const server = new Server();
    console.log("2. Server instance created");

    // Wait for DB + routes
    await server.initialize(app);
    console.log("3. Server initialized");

    // Swagger
    app.use("/api-docs", SwaggerUI.serve, SwaggerUI.setup(swaggerOutput));

    // Global error middleware MUST be after routes
    app.use(errorMiddleware);
    // console.log("4. Error middleware added");

    // Start server ONLY ONCE
    app.listen(Number(PORT), serverIP, () => {
      console.log(`Server running on ${PORT}`);
    });

    process.on("unhandledRejection", (reason) => {
      console.error("UNHANDLED REJECTION:", reason);
      process.exit(1);
    });

    process.on("uncaughtException", (error) => {
      console.error("UNCAUGHT EXCEPTION:", error);
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
export default app;
