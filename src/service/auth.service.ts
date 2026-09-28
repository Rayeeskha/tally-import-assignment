import { AuthResponse, SigninRequest } from "../interfaces/user.interface";
import AuthRepository from "../repository/auth.repository";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../utils/jwt";
import { UserResource } from "../resources/user.resource";
import { ERRORS, HTTP_STATUS } from "../constants";

export default class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  async signin(data: SigninRequest): Promise<AuthResponse> {
    const email = data.email.toLowerCase().trim();

    const user = await this.authRepository.findByEmailWithPassword(email);
    if (!user) {
      throw Object.assign(new Error(ERRORS.INVALID_CREDENTIALS), {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }

    const passwordMatched = await bcrypt.compare(data.password, user.password);

    if (!passwordMatched) {
      throw Object.assign(new Error(ERRORS.INVALID_CREDENTIALS), {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
      });
    }
    const accessToken = generateAccessToken({
      id: Number(user.id),
      email: user.email,
    });

    const result: AuthResponse = {
      accessToken,
      user: UserResource.transform(user),
    };
    return result;
  }

  async logout(token: string): Promise<void> {
    // const decode = jwt.decode(token) as { exp: number };
    const currentTime = Math.floor(Date.now() / 1000);
    // const ttl = decode.exp - currentTime;
    // if (ttl > 0) {
    //   await redisClient.setEx(`blacklist:${token}`, ttl, "true");
    // }
  }
}
