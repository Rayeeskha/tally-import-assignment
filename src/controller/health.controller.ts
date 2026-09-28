import { HTTP_STATUS, SUCCESS } from "../constants";
import { successResponse } from "../utils/response";
import { NextFunction, Request, Response } from "express";

export default class HealthController {
  health = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      successResponse(res, HTTP_STATUS.OK, SUCCESS.HEALTH_MSG);
    } catch (error) {
      console.log("HealthController.health:ERROR:", error);
      next(error);
    }
  };
}
