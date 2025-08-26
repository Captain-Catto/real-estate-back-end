import { Router } from "express";
import { NotificationController } from "../controllers/NotificationController";
import { authenticateUser } from "../middleware";

const router = Router();

// User notification routes
router.get("/", authenticateUser, NotificationController.getNotifications);
router.get("/unread-count", authenticateUser, NotificationController.getUnreadCount);
router.put("/:id/read", authenticateUser, NotificationController.markAsRead);
router.put("/read-all", authenticateUser, NotificationController.markAllAsRead);
router.delete("/:id", authenticateUser, NotificationController.deleteNotification);

// Test endpoint (only for development)
router.post("/test", authenticateUser, NotificationController.createTestNotification);

export default router;