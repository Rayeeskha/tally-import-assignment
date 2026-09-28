import Router from "express";
import AuthController from "../controller/auth.controller";
import AuthRepository from "../repository/auth.repository";
import AuthService from "../service/auth.service";
import { validate } from "../middleware/validate.middleware";
import { signinSchema } from "../schema/user.schema";
import { authMiddleware } from "../middleware/auth.middleware";

class AuthRoutes {
  router = Router();
  private readonly authService: AuthService;
  private readonly authRepository: AuthRepository;
  private readonly authController: AuthController;
  constructor() {
    this.authRepository = new AuthRepository();
    this.authService = new AuthService(this.authRepository);
    this.authController = new AuthController(this.authService);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/signin", validate(signinSchema), this.authController.signin);

    this.router.post("/logout", authMiddleware, this.authController.logout);
  }
}

export default new AuthRoutes().router;
