import { Router } from "express";
import { NewsController } from "../controllers";
import { authenticateUser, authenticateAdmin } from "../middleware";

const router = Router();
const newsController = new NewsController();

// ===== PUBLIC ROUTES =====

// Get published news with pagination and filters
// GET /api/news?page=1&limit=12&category=mua-ban&search=keyword&featured=true&hot=true
router.get("/", newsController.getPublishedNews);

// Get news categories with counts
// GET /api/news/categories
router.get("/categories", newsController.getNewsCategories);

// Get featured news for homepage
// GET /api/news/featured?limit=6
router.get("/featured", newsController.getFeaturedNews);

// Get hot news
// GET /api/news/hot?limit=10
router.get("/hot", newsController.getHotNews);

// Get single news by slug
// GET /api/news/slug/:slug
router.get("/slug/:slug", newsController.getNewsBySlug);

// ===== ADMIN ROUTES =====

// Get all news for admin (with filters)
// GET /api/news/admin?page=1&limit=20&status=all&category=all&author=userId&search=keyword
router.get("/admin", authenticateUser, newsController.getAdminNews);

// Create new news
// POST /api/news/admin
router.post("/admin", authenticateUser, newsController.createNews);

// Get single news for editing
// GET /api/news/admin/:id
router.get("/admin/:id", authenticateUser, newsController.getNewsById);

// Update news
// PUT /api/news/admin/:id
router.put("/admin/:id", authenticateUser, newsController.updateNews);

// Delete news
// DELETE /api/news/admin/:id
router.delete("/admin/:id", authenticateUser, newsController.deleteNews);

// Update news status (admin only)
// PUT /api/news/admin/:id/status
router.put(
  "/admin/:id/status",
  authenticateAdmin,
  newsController.updateNewsStatus
);

// Get news statistics (admin only)
// GET /api/news/admin/stats
router.get("/admin/stats", authenticateAdmin, newsController.getNewsStats);

export default router;
