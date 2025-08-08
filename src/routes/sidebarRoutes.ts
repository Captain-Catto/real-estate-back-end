import { Router } from "express";
import { SidebarController } from "../controllers/SidebarController";
import { requireAuth, requireAdmin } from "../middleware";

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
 * @desc Tạo cấu hình sidebar mới (Admin only)
 * @access Private (Admin)
 */
router.post("/configs", requireAdmin, SidebarController.createConfig);

/**
 * @route PUT /api/sidebar/configs/:id
 * @desc Cập nhật cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.put("/configs/:id", requireAdmin, SidebarController.updateConfig);

/**
 * @route DELETE /api/sidebar/configs/:id
 * @desc Xóa cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.delete("/configs/:id", requireAdmin, SidebarController.deleteConfig);

/**
 * @route PUT /api/sidebar/configs/:id/default
 * @desc Đặt cấu hình làm mặc định (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/configs/:id/default",
  requireAdmin,
  SidebarController.setDefaultConfig
);

/**
 * @route PUT /api/sidebar/configs/:configId/reorder-items
 * @desc Sắp xếp lại thứ tự items trong cấu hình (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/configs/:configId/reorder-items",
  requireAdmin,
  SidebarController.reorderItems
);

/**
 * @route POST /api/sidebar/configs/:configId/items
 * @desc Thêm menu item mới vào cấu hình (Admin only)
 * @access Private (Admin)
 */
router.post(
  "/configs/:configId/items",
  requireAdmin,
  SidebarController.addMenuItem
);

/**
 * @route DELETE /api/sidebar/configs/:configId/items/:itemId
 * @desc Xóa menu item khỏi cấu hình (Admin only)
 * @access Private (Admin)
 */
router.delete(
  "/configs/:configId/items/:itemId",
  requireAdmin,
  SidebarController.removeMenuItem
);
export default router;
