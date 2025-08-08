import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/auth";
import UserPermission from "../models/UserPermission";

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface AuthOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePermissions?: string[];
  requireAnyPermission?: boolean; // If true, user needs ANY of the permissions, otherwise ALL
}

/**
 * Unified authentication middleware
 * Handles token extraction, verification, role checking, and permission validation
 */
export const authenticate = (options: AuthOptions = {}) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const {
      requireAuth = true,
      requireAdmin = false,
      requirePermissions = [],
      requireAnyPermission = false,
    } = options;

    try {
      // Extract token from header or cookie
      const authHeader = req.header("Authorization");
      const cookieToken = req.cookies?.accessToken;

      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.substring(7)
        : cookieToken;

      // If no authentication is required and no token present, continue
      if (!requireAuth && !token) {
        return next();
      }

      // If authentication is required but no token present
      if (
        (requireAuth || requireAdmin || requirePermissions.length > 0) &&
        !token
      ) {
        return res.status(401).json({
          success: false,
          message: "Access denied. No token provided.",
        });
      }

      // Verify token if present
      if (token) {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
      }

      // Check admin role if required
      if (requireAdmin && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
        });
      }

      // Check permissions if required
      if (requirePermissions.length > 0) {
        // Admin always has all permissions
        if (req.user?.role === "admin") {
          return next();
        }

        // User must be authenticated for permission checks
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: "Authentication required for this action.",
          });
        }

        // Get user permissions
        const userPermission = await UserPermission.findOne({
          userId: req.user.userId,
        });

        console.log(`🔍 Permission check for ${req.user.email}:`);
        console.log(
          `   - Required permissions: [${requirePermissions.join(", ")}]`
        );
        console.log(`   - User ID: ${req.user.userId}`);
        console.log(`   - Permission record found: ${!!userPermission}`);

        if (userPermission) {
          console.log(
            `   - User permissions: [${userPermission.permissions.join(", ")}]`
          );
          const hasStats =
            userPermission.permissions.includes("view_statistics");
          console.log(`   - Has view_statistics: ${hasStats ? "✅" : "❌"}`);
        }

        if (!userPermission) {
          console.log("❌ No permissions found for user");
          return res.status(403).json({
            success: false,
            message: "No permissions found for this user.",
          });
        }

        // Check if user has required permissions
        const hasRequiredPermissions = requireAnyPermission
          ? requirePermissions.some((permission) =>
              userPermission.permissions.includes(permission)
            )
          : requirePermissions.every((permission) =>
              userPermission.permissions.includes(permission)
            );

        if (!hasRequiredPermissions) {
          const message = requireAnyPermission
            ? "You don't have any of the required permissions for this action."
            : "You don't have all the required permissions for this action.";

          console.log(`❌ Permission denied for ${req.user?.email}`);
          console.log(`   - Required: [${requirePermissions.join(", ")}]`);
          console.log(
            `   - User has: [${userPermission.permissions.join(", ")}]`
          );
          console.log(`   - Any permission mode: ${requireAnyPermission}`);

          return res.status(403).json({
            success: false,
            message,
          });
        }

        console.log(`✅ Permission granted for ${req.user?.email}`);
        console.log(`   - Required: [${requirePermissions.join(", ")}]`);
        console.log(`   - Access granted\n`);
      }

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

      console.error("Authentication error:", error);
      return res.status(500).json({
        success: false,
        message: "Authentication system error",
      });
    }
  };
};

/**
 * Convenience middleware for common authentication scenarios
 */

// Basic user authentication (just verify token)
export const requireAuth = authenticate({ requireAuth: true });

// Admin authentication
export const requireAdmin = authenticate({ requireAdmin: true });

// Permission-based authentication
export const requirePermission = (permission: string) =>
  authenticate({ requirePermissions: [permission] });

export const requireAllPermissions = (permissions: string[]) =>
  authenticate({ requirePermissions: permissions });

export const requireAnyPermission = (permissions: string[]) =>
  authenticate({ requirePermissions: permissions, requireAnyPermission: true });

// Optional authentication (user info if present, but not required)
export const optionalAuth = authenticate({ requireAuth: false });

/**
 * Legacy middleware for backward compatibility
 * These will be deprecated in favor of the unified authenticate() function
 */
export const authenticateUser = requireAuth;
export const authenticateAdmin = requireAdmin;
