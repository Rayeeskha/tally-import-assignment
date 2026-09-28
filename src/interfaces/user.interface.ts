// export interface SignupRequest {
//   name: string;
//   email: string;
//   password: string;
// }

export interface SigninRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}
