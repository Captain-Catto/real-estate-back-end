import { Request, Response, NextFunction } from "express";

// Export the unified authentication system
export * from "./auth";

// Other utility middleware
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
