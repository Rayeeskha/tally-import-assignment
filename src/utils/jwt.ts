import jwt from "jsonwebtoken";

export function generateAccessToken(payload: { id: number; email: string }) {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "1h",
  });
}
