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
 * @route POST /api/sidebar/config
 * @desc Cập nhật cấu hình sidebar (Admin only)
 * @access Private (Admin)
 */
router.post(
  "/config",
  authenticateAdmin,
  SidebarController.updateSidebarConfig
);

/**
 * @route POST /api/sidebar/config/reset
 * @desc Reset về cấu hình mặc định (Admin only)
 * @access Private (Admin)
 */
router.post(
  "/config/reset",
  authenticateAdmin,
  SidebarController.resetSidebarConfig
);

/**
 * @route PUT /api/sidebar/config/reorder-groups
 * @desc Cập nhật thứ tự groups (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/config/reorder-groups",
  authenticateAdmin,
  SidebarController.reorderGroups
);

/**
 * @route PUT /api/sidebar/config/reorder-items
 * @desc Cập nhật thứ tự items trong group (Admin only)
 * @access Private (Admin)
 */
router.put(
  "/config/reorder-items",
  authenticateAdmin,
  SidebarController.reorderItems
);

/**
 * @route GET /api/sidebar/config/history
 * @desc Lấy lịch sử thay đổi cấu hình (Admin only)
 * @access Private (Admin)
 */
router.get(
  "/config/history",
  authenticateAdmin,
  SidebarController.getConfigHistory
);

export default router;
