import { Router } from "express";
import { PermissionController } from "../controllers/PermissionController";
import { authenticateAdmin, requireAuth } from "../middleware";

const router = Router();

// Lấy danh sách quyền có sẵn
router.get(
  "/available",
  authenticateAdmin,
  PermissionController.getAvailablePermissions
);

// Lấy danh sách người dùng và quyền (chỉ admin)
router.get(
  "/users",
  authenticateAdmin,
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
  authenticateAdmin,
  PermissionController.updateUserPermissions
);

// Tạo quyền cho người dùng
router.post(
  "/user",
  authenticateAdmin,
  PermissionController.createUserPermissions
);

// Xóa quyền của người dùng
router.delete(
  "/user/:userId",
  authenticateAdmin,
  PermissionController.deleteUserPermissions
);

// Employee permission management routes
// Lấy danh sách employee và quyền của họ
router.get(
  "/employees",
  authenticateAdmin,
  PermissionController.getEmployeesAndPermissions
);

// Cập nhật quyền cho employee (chỉ các quyền có thể quản lý)
router.put(
  "/employee/:userId",
  authenticateAdmin,
  PermissionController.updateEmployeePermissions
);

export default router;
