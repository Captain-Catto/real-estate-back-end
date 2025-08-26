import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/auth";
import UserPermission from "../models/UserPermission";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { User } from "../models/User";

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
        try {
          // Check if token is blacklisted
          const blacklistedToken = await BlacklistedToken.findOne({ token });
          if (blacklistedToken) {
            return res.status(401).json({
              success: false,
              message: "Token has been invalidated.",
              code: "TOKEN_BLACKLISTED",
            });
          }

          const decoded = verifyAccessToken(token);
          req.user = decoded;

          // Check if user is banned (only if authentication is required)
          if (requireAuth || requireAdmin || requirePermissions.length > 0) {
            console.log(
              `🔍 Checking banned status for user: ${decoded.userId}`
            );
            const currentUser = await User.findById(decoded.userId);
            console.log(
              `👤 User found in DB:`,
              currentUser
                ? `${currentUser.email} - status: ${currentUser.status}`
                : "Not found"
            );

            if (currentUser && currentUser.status === "banned") {
              console.log(
                `🚫 User ${currentUser.email} is BANNED - blocking access`
              );
              return res.status(403).json({
                success: false,
                message:
                  "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
                code: "USER_BANNED",
              });
            } else {
              console.log(
                `✅ User ${
                  currentUser?.email || "unknown"
                } is NOT banned - allowing access`
              );
            }
          }
        } catch (error) {
          console.log(
            `🚫 Token verification failed:`,
            error instanceof Error ? error.message : "Unknown error"
          );
          return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
            code: "TOKEN_INVALID",
          });
        }
      }

      // Check admin role if required
      if (requireAdmin && req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập, quyền quản trị viên yêu cầu.",
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
            message: "Cần xác thực để thực hiện hành động này.",
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
            ? "Bạn không có quyền nào trong số các quyền cần thiết cho hành động này."
            : "Bạn không có tất cả các quyền cần thiết cho hành động này.";

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
