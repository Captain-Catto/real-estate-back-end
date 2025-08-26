import { Router } from "express";
import { AdminController, HeaderSettingsController } from "../controllers";
import { requirePermission } from "../middleware";
import { validateBody, registerSchema, adminUpdateUserSchema } from "../validations";

const router = Router();

// Dashboard routes
router.get("/stats", requirePermission("view_dashboard"), AdminController.getAdminStats);
router.get("/recent-activities", requirePermission("view_dashboard"), AdminController.getRecentActivities);
router.get("/top-posts", requirePermission("view_dashboard"), AdminController.getTopPosts);

// Posts management routes
router.get("/posts", requirePermission("view_posts"), AdminController.getAdminPosts);
router.get("/posts/stats", requirePermission("view_posts"), AdminController.getAdminPostsStats);
router.get("/posts/:id", requirePermission("view_posts"), AdminController.getAdminPostById);
router.put("/posts/:id", requirePermission("edit_post"), AdminController.updateAdminPost);
router.put("/posts/:id/approve", requirePermission("approve_post"), AdminController.approvePost);
router.put("/posts/:id/reject", requirePermission("reject_post"), AdminController.rejectPost);
router.delete("/posts/:id", requirePermission("delete_post"), AdminController.deleteAdminPost);

// User management routes
router.get("/users", requirePermission("view_users"), AdminController.getUsers);
router.get("/user-stats", requirePermission("view_users"), AdminController.getUserStats);
router.post("/users", requirePermission("create_user"), validateBody(registerSchema), AdminController.createUser);
router.get("/users/:id", requirePermission("view_users"), AdminController.getUserById);
router.get("/users/:id/posts", requirePermission("view_users"), AdminController.getUserPosts);
router.get("/users/:id/payments", requirePermission("view_users"), AdminController.getUserPayments);
router.get("/users/:id/logs", requirePermission("view_users"), AdminController.getUserLogs);
router.put("/users/:id", requirePermission("edit_user"), validateBody(adminUpdateUserSchema), AdminController.updateUser);
router.patch("/users/:id/status", requirePermission("change_user_status"), AdminController.updateUserStatus);
router.delete("/users/:id", requirePermission("delete_user"), AdminController.deleteUser);

// Payment management routes
router.get("/payments", requirePermission("view_transactions"), AdminController.getAllPayments);
router.post("/payments/cancel-expired", requirePermission("view_transactions"), AdminController.cancelExpiredPayments);

// Header Settings Routes
router.get("/header-settings", requirePermission("view_settings"), HeaderSettingsController.getHeaderMenus);
router.post("/header-settings", requirePermission("edit_settings"), HeaderSettingsController.createHeaderMenu);
router.put("/header-settings/reorder", requirePermission("edit_settings"), HeaderSettingsController.updateMenuOrder);
router.post("/header-settings/reset", requirePermission("edit_settings"), HeaderSettingsController.resetToDefault);
router.put("/header-settings/:id", requirePermission("edit_settings"), HeaderSettingsController.updateHeaderMenu);
router.delete("/header-settings/:id", requirePermission("edit_settings"), HeaderSettingsController.deleteHeaderMenu);
router.patch("/header-settings/:id/toggle", requirePermission("edit_settings"), HeaderSettingsController.toggleMenuStatus);

export default router;