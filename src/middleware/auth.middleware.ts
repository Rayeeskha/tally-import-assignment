import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { errorResponse } from "../utils/response";
import { ERRORS, HTTP_STATUS } from "../constants";
// import redisClient from "../config/redis";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERRORS.TOKEN_REQUIRED);
    }
    const actualToken = token.split(" ")[1];
    if (!actualToken) {
      return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERRORS.TOKEN_REQUIRED);
    }
    // verify jwt
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET as string) as JwtPayload;

    // check Redis blacklist
    // const blacklisted = await redisClient.get(`blacklist:${actualToken}`);
    // if (blacklisted) {
    //   return errorResponse(res, HTTP_STATUS.UNAUTHORIZED, ERRORS.TOKEN_LOGOUT);
    // }

    // 4. Store user information
    req.user = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
