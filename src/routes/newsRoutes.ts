import { Router } from "express";
import { NewsController, NewsCategoryController } from "../controllers";
import { requirePermission } from "../middleware";

const router = Router();
const newsController = new NewsController();
const newsCategoryController = new NewsCategoryController();

// Public news routes
router.get("/categories", newsController.getNewsCategories.bind(newsController));
router.get("/slug/:slug", newsController.getNewsBySlug.bind(newsController));
router.get("/user/:userId", newsController.getNewsByUser.bind(newsController));
router.get("/", newsController.getPublishedNews.bind(newsController));

// Admin news routes
router.get("/admin", requirePermission("view_news"), newsController.getAdminNews.bind(newsController));
router.post("/admin", requirePermission("create_news"), newsController.createNews.bind(newsController));
router.get("/admin/stats", requirePermission("view_news"), newsController.getNewsStats.bind(newsController));

// News category admin routes
router.get("/admin/categories", requirePermission("manage_news_categories"), newsCategoryController.getAdminNewsCategories.bind(newsCategoryController));
router.post("/admin/categories", requirePermission("manage_news_categories"), newsCategoryController.createNewsCategory.bind(newsCategoryController));
router.put("/admin/categories/order", requirePermission("manage_news_categories"), newsCategoryController.updateNewsCategoriesOrder.bind(newsCategoryController));
router.put("/admin/categories/:id", requirePermission("manage_news_categories"), newsCategoryController.updateNewsCategory.bind(newsCategoryController));
router.delete("/admin/categories/:id", requirePermission("manage_news_categories"), newsCategoryController.deleteNewsCategory.bind(newsCategoryController));

// Dynamic news routes (at the end)
router.get("/admin/:id", requirePermission("edit_news"), newsController.getNewsById.bind(newsController));
router.put("/admin/:id", requirePermission("edit_news"), newsController.updateNews.bind(newsController));
router.delete("/admin/:id", requirePermission("delete_news"), newsController.deleteNews.bind(newsController));
router.put("/admin/:id/status", requirePermission("feature_news"), newsController.updateNewsStatus.bind(newsController));

export default router;