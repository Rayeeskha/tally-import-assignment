import { Request, Response } from "express";
import { HTTP_STATUS, SUCCESS } from "../constants";
import AuthService from "../service/auth.service";
import { SigninRequest } from "../interfaces/user.interface";
import { successResponse } from "../utils/response";
import { NextFunction } from "express";
export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  signin = async (
    req: Request<{}, {}, SigninRequest>,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await this.authService.signin(req.body);
      successResponse(res, HTTP_STATUS.OK, SUCCESS.USER_LOGIN, result);
    } catch (error) {
      console.log("AuthController.signIn", error);
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      await this.authService.logout(token as string);
      successResponse(res, HTTP_STATUS.OK, SUCCESS.USER_LOGOUT);
    } catch (error) {
      console.log("AuthController.logout:ERROR:", error);
      next(error);
    }
  };
}
