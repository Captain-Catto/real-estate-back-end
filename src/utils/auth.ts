import jwt, { SignOptions } from "jsonwebtoken";
import { IUser } from "../models";

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  exp?: number; // JWT expiration timestamp
  iat?: number; // JWT issued at timestamp
}

export const generateAccessToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
  };

  return jwt.sign(payload, process.env.JWT_SECRET || "default-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
  } as SignOptions);
};

export const generateRefreshToken = (user: IUser): string => {
  const payload: TokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role || "user",
  };

  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || "default-refresh-secret",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" } as SignOptions
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    console.log(`🔍 JWT verification debug:`, {
      tokenLength: token.length,
      tokenStart: token.substring(0, 20),
      secret: process.env.JWT_SECRET ? "Set" : "Using default",
      secretLength: (process.env.JWT_SECRET || "default-secret").length,
    });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default-secret"
    ) as TokenPayload;

    console.log(`✅ JWT verification successful:`, {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat,
    });

    return decoded;
  } catch (error) {
    console.log(`❌ JWT verification failed:`, {
      error: error instanceof Error ? error.message : "Unknown error",
      tokenPreview: token.substring(0, 20) + "...",
      secretStatus: process.env.JWT_SECRET
        ? "Environment variable set"
        : "Using default",
    });
    throw error;
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET || "default-refresh-secret"
  ) as TokenPayload;
};
