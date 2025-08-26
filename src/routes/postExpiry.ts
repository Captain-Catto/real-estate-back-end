import { Router } from "express";
import { PostExpiryController } from "../controllers/PostExpiryController";
import { requirePermission } from "../middleware/auth";

const router = Router();

// Admin routes cho post expiry management
router.get(
  "/status",
  requirePermission("view_dashboard"),
  PostExpiryController.getSchedulerStatus
);

router.post(
  "/run-check", 
  requirePermission("manage_posts"),
  PostExpiryController.runManualCheck
);

router.get(
  "/stats",
  requirePermission("view_dashboard"),
  PostExpiryController.getPostExpiryStats
);

export default router;