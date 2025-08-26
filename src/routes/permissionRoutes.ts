import { Router } from "express";
import { PermissionController } from "../controllers/PermissionController";
import {
  authenticateAdmin,
  requireAuth,
  requirePermission,
} from "../middleware";

const router = Router();

// Lấy danh sách quyền có sẵn
router.get(
  "/available",
  requirePermission("view_settings"), // Changed from authenticateAdmin
  PermissionController.getAvailablePermissions
);

// Lấy danh sách người dùng và quyền
router.get(
  "/users",
  requirePermission("view_users"), // Changed from authenticateAdmin
  PermissionController.getUsersAndPermissions
);

// Lấy quyền của người dùng (admin hoặc chính người dùng đó)
router.get(
  "/user/:userId",
  requireAuth,
  PermissionController.getUserPermissions
);

// Cập nhật quyền cho người dùng
router.put(
  "/user/:userId",
  requirePermission("change_user_role"), // Changed from authenticateAdmin
  PermissionController.updateUserPermissions
);

// Tạo quyền cho người dùng
router.post(
  "/user",
  requirePermission("change_user_role"), // Changed from authenticateAdmin
  PermissionController.createUserPermissions
);

// Xóa quyền của người dùng
router.delete(
  "/user/:userId",
  requirePermission("change_user_role"), // Changed from authenticateAdmin
  PermissionController.deleteUserPermissions
);

// Employee permission management routes
// Lấy danh sách employee và quyền của họ
router.get(
  "/employees",
  requirePermission("view_users"), // Changed from authenticateAdmin
  PermissionController.getEmployeesAndPermissions
);

// Cập nhật quyền cho employee (chỉ các quyền có thể quản lý)
router.put(
  "/employee/:userId",
  requirePermission("change_user_role"), // Changed from authenticateAdmin
  PermissionController.updateEmployeePermissions
);

export default router;
