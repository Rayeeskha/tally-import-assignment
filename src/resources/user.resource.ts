import { UserResponse } from "../interfaces/user.interface";
import User from "../models/user.model";

export class UserResource {
  static transform(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
