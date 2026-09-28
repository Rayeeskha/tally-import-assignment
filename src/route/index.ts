import { Application } from "express";
// import AuthRoutes from "./auth.routes";

import HealthRoutes from "./health.route";
import TallyRoutes from "./tally.routes";
import AuthRoutes from "./auth.routes";
import { authMiddleware } from "../middleware/auth.middleware";

export default class Route {
  constructor(app: Application) {
    app.use("/", HealthRoutes);
    app.use("/api/auth", AuthRoutes);
    app.use("/api/tally", authMiddleware, TallyRoutes);
  }
}
