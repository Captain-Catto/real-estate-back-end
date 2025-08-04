import { Router } from "express";
import { SidebarController } from "../controllers/SidebarController";
import { authenticateUser, authenticateAdmin } from "../middleware/index";

const router = Router();

/**
 * @route GET /api/sidebar/config
 * @desc Lấy cấu hình sidebar cho user hiện tại
 * @access Private
 */
router.get("/config", authenticateUser, SidebarController.getSidebarConfig);

/**
 * @route GET /api/sidebar/configs
 * @desc Lấy tất cả cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.get("/configs", authenticateAdmin, SidebarController.getAllConfigs);

/**
 * @route POST /api/sidebar/configs
 * @desc Tạo cấu hình sidebar mới (Admin only)
 * @access Private (Admin)
 */
router.post("/configs", authenticateAdmin, SidebarController.createConfig);

/**
 * @route PUT /api/sidebar/configs/:id
 * @desc Cập nhật cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.put("/configs/:id", authenticateAdmin, SidebarController.updateConfig);

/**
 * @route DELETE /api/sidebar/configs/:id
 * @desc Xóa cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.delete(
  "/configs/:id",
  authenticateAdmin,
  SidebarController.deleteConfig
);

/**
 * @route PUT /api/sidebar/configs/:id/default
 * @desc Đặt cấu hình làm mặc định (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/configs/:id/default",
  authenticateAdmin,
  SidebarController.setDefaultConfig
);

/**
 * @route PUT /api/sidebar/configs/:configId/reorder-items
 * @desc Sắp xếp lại thứ tự items trong cấu hình (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/configs/:configId/reorder-items",
  authenticateAdmin,
  SidebarController.reorderItems
);

/**
 * @route POST /api/sidebar/configs/:configId/items
 * @desc Thêm menu item mới vào cấu hình (Admin only)
 * @access Private (Admin)
 */
router.post(
  "/configs/:configId/items",
  authenticateAdmin,
  SidebarController.addMenuItem
);

/**
 * @route DELETE /api/sidebar/configs/:configId/items/:itemId
 * @desc Xóa menu item khỏi cấu hình (Admin only)
 * @access Private (Admin)
 */
router.delete(
  "/configs/:configId/items/:itemId",
  authenticateAdmin,
  SidebarController.removeMenuItem
);

export default router;
