import Router from "express";
import HealthController from "../controller/health.controller";

class HealthRoutes {
  router = Router();
  private readonly healthController: HealthController;

  constructor() {
    this.healthController = new HealthController();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/health", this.healthController.health);
  }
}

export default new HealthRoutes().router;
