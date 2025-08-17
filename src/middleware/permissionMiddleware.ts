import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./index";
import UserPermission from "../models/UserPermission";

/**
 * Kiểm tra người dùng có quyền truy cập không
 */
export const hasPermission = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
  requiredPermission: string
) => {
  try {
    // Trường hợp 1: Admin luôn có quyền truy cập
    if (req.user?.role === "admin") {
      return next();
    }

    // Trường hợp 2: Người dùng phải đăng nhập
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để thực hiện hành động này",
      });
    }

    // Trường hợp 3: Kiểm tra quyền
    const userPermission = await UserPermission.findOne({
      userId: req.user.userId,
    });

    // Nếu không có bản ghi quyền hoặc không có quyền yêu cầu
    if (
      !userPermission ||
      !userPermission.permissions.includes(requiredPermission)
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền thực hiện hành động này",
      });
    }

    // Có quyền, cho phép tiếp tục
    next();
  } catch (error) {
    console.error("Lỗi kiểm tra quyền:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi kiểm tra quyền",
    });
  }
};

/**
 * Factory function để tạo middleware kiểm tra một quyền cụ thể
 */
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    return hasPermission(req, res, next, permission);
  };
};

/**
 * Kiểm tra nhiều quyền (phải có tất cả)
 */
export const requireAllPermissions = (permissions: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Admin luôn có quyền
      if (req.user?.role === "admin") {
        return next();
      }

      // Người dùng phải đăng nhập
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Bạn cần đăng nhập để thực hiện hành động này",
        });
      }

      // Lấy quyền của người dùng
      const userPermission = await UserPermission.findOne({
        userId: req.user.userId,
      });

      // Không có bản ghi quyền
      if (!userPermission) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Kiểm tra có tất cả các quyền
      const hasAllPermissions = permissions.every((permission) =>
        userPermission.permissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có đủ quyền để thực hiện hành động này",
        });
      }

      // Có đủ quyền
      next();
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra quyền",
      });
    }
  };
};

/**
 * Kiểm tra nhiều quyền (chỉ cần có một trong số đó)
 */
export const requireAnyPermission = (permissions: string[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Admin luôn có quyền
      if (req.user?.role === "admin") {
        return next();
      }

      // Người dùng phải đăng nhập
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Bạn cần đăng nhập để thực hiện hành động này",
        });
      }

      // Lấy quyền của người dùng
      const userPermission = await UserPermission.findOne({
        userId: req.user.userId,
      });

      // Không có bản ghi quyền
      if (!userPermission) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Kiểm tra có ít nhất một quyền
      const hasAnyPermission = permissions.some((permission) =>
        userPermission.permissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền để thực hiện hành động này",
        });
      }

      // Có quyền
      next();
    } catch (error) {
      console.error("Lỗi kiểm tra quyền:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi hệ thống khi kiểm tra quyền",
      });
    }
  };
};
