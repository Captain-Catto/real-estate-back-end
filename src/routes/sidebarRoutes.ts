import { Router } from "express";
import { SidebarController } from "../controllers/SidebarController";
import { requireAuth, requireAdmin, requirePermission } from "../middleware";

const router = Router();

/**
 * @route GET /api/sidebar/config
 * @desc Lấy cấu hình sidebar cho user hiện tại
 * @access Private
 */
router.get("/config", requireAuth, SidebarController.getSidebarConfig);

/**
 * @route GET /api/sidebar/configs
 * @desc Lấy tất cả cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.get("/configs", requireAdmin, SidebarController.getAllConfigs);

/**
 * @route POST /api/sidebar/configs
 * @desc Tạo cấu hình sidebar mới (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.post(
  "/configs",
  requirePermission("edit_settings"),
  SidebarController.createConfig
);

/**
 * @route PUT /api/sidebar/configs/:id
 * @desc Cập nhật cấu hình sidebar (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.put(
  "/configs/:id",
  requirePermission("edit_settings"),
  SidebarController.updateConfig
);

/**
 * @route DELETE /api/sidebar/configs/:id
 * @desc Xóa cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.delete("/configs/:id", requireAdmin, SidebarController.deleteConfig);

/**
 * @route PUT /api/sidebar/configs/:id/default
 * @desc Đặt cấu hình làm mặc định (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.put(
  "/configs/:id/default",
  requirePermission("edit_settings"),
  SidebarController.setDefaultConfig
);

/**
 * @route PUT /api/sidebar/configs/:configId/reorder-items
 * @desc Sắp xếp lại thứ tự items trong cấu hình (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.put(
  "/configs/:configId/reorder-items",
  requirePermission("edit_settings"),
  SidebarController.reorderItems
);

/**
 * @route POST /api/sidebar/configs/:configId/items
 * @desc Thêm menu item mới vào cấu hình (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.post(
  "/configs/:configId/items",
  requirePermission("edit_settings"),
  SidebarController.addMenuItem
);

/**
 * @route DELETE /api/sidebar/configs/:configId/items/:itemId
 * @desc Xóa menu item khỏi cấu hình (Admin + edit_settings permission)
 * @access Private (Admin + Permission)
 */
router.delete(
  "/configs/:configId/items/:itemId",
  requirePermission("edit_settings"),
  SidebarController.removeMenuItem
);
export default router;
