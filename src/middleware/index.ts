import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/auth";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

export const validateRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Implement validation logic here
  next();
};

export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  console.log("=== AUTHENTICATION MIDDLEWARE ===");
  console.log("Request headers:", req.headers);

  const authHeader = req.header("Authorization");
  console.log("Authorization header:", authHeader);

  const token =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;
  console.log("Extracted token:", token ? "Token present" : "No token");

  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
          code: "INVALID_TOKEN",
        });
      }
    }
    res.status(401).json({
      success: false,
      message: "Token verification failed",
    });
  }
};
