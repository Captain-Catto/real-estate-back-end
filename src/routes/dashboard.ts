import { Router } from "express";
import { DashboardController } from "../controllers/DashboardController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

// Get contact request statistics by period (weekly/monthly/yearly) - user specific
router.get(
  "/contact-stats",
  requireAuth,
  DashboardController.getContactRequestStats
);

// Get top posts by views for current user
router.get("/top-posts", requireAuth, DashboardController.getTopPostsByViews);

// Get admin dashboard data (admin/employee only)
router.get(
  "/admin-data",
  requireAdmin,
  DashboardController.getAdminDashboardData
);

export default router;
