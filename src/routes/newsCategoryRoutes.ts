import express from "express";
import { NewsCategoryController } from "../controllers/NewsCategoryController";
import { authenticateUser, authenticateAdmin } from "../middleware";

const router = express.Router();
const newsCategoryController = new NewsCategoryController();

// Public routes - Lấy danh mục tin tức công khai
// GET /api/news/categories
router.get("/categories", newsCategoryController.getPublicNewsCategories);

// Admin routes - Quản lý danh mục tin tức
// GET /api/news/admin/categories
router.get(
  "/admin/categories",
  authenticateAdmin,
  newsCategoryController.getAdminNewsCategories
);

// POST /api/news/admin/categories
router.post(
  "/admin/categories",
  authenticateAdmin,
  newsCategoryController.createNewsCategory
);

// PUT /api/news/admin/categories/:id
router.put(
  "/admin/categories/:id",
  authenticateAdmin,
  newsCategoryController.updateNewsCategory
);

// DELETE /api/news/admin/categories/:id
router.delete(
  "/admin/categories/:id",
  authenticateAdmin,
  newsCategoryController.deleteNewsCategory
);

// PUT /api/news/admin/categories/order
router.put(
  "/admin/categories/order",
  authenticateAdmin,
  newsCategoryController.updateNewsCategoriesOrder
);

export default router;
