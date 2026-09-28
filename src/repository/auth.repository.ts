import User from "../models/user.model";
import { CreateUserRequest } from "../interfaces/user.interface";

export default class AuthRepository {
  async findByEmail(email: string): Promise<User | null> {
    return User.findOne({
      where: { email },
    });
  }

  async findByEmailWithPassword(email: string) {
    return User.findOne({
      where: { email },
    });
  }

  async createUser(data: CreateUserRequest): Promise<User> {
    const user = new User();

    user.name = data.name;
    user.email = data.email;
    user.password = data.password;

    return await user.save();
  }

  async findById(id: number): Promise<User | null> {
    return User.findOne({
      where: { id },
    });
  }
}
