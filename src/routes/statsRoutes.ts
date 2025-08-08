import { Router } from "express";
import { StatsController } from "../controllers/StatsController";
import { requirePermission } from "../middleware/auth";

const router = Router();

// Tất cả routes đều yêu cầu permission view_statistics
router.use(requirePermission("view_statistics"));

// GET /api/admin/stats/overview - Thống kê tổng quan
router.get("/overview", StatsController.getOverviewStats);

// GET /api/admin/stats/revenue-chart - Biểu đồ doanh thu theo thời gian
router.get("/revenue-chart", StatsController.getRevenueChart);

// GET /api/admin/stats/posts-chart - Biểu đồ phân bố gói tin đăng
router.get("/posts-chart", StatsController.getPostsChart);

// GET /api/admin/stats/property-types-chart - Biểu đồ loại bất động sản
router.get("/property-types-chart", StatsController.getPropertyTypesChart);

// GET /api/admin/stats/top-locations - Top địa điểm có nhiều bài đăng
router.get("/top-locations", StatsController.getTopLocations);

// GET /api/admin/stats/user-chart - Biểu đồ đăng ký người dùng theo thời gian
router.get("/user-chart", StatsController.getUserChart);

// GET /api/admin/stats/page-views - Thống kê lượt xem trang
router.get("/page-views", StatsController.getPageViewStats);

// Public routes (không cần auth)
const publicRouter = Router();

// POST /api/stats/track-view - Track page view
publicRouter.post("/track-view", StatsController.trackPageView);

export { publicRouter };
export default router;
