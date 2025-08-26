import { Router } from "express";
import { CategoryController, AreaController, PriceController } from "../controllers";
import { requirePermission } from "../middleware";

const router = Router();
const categoryController = new CategoryController();
const areaController = new AreaController();
const priceController = new PriceController();

// Public Category routes
router.get("/", categoryController.getCategories.bind(categoryController));
router.get("/isProject/:isProject", categoryController.getCategoryByIsProject.bind(categoryController));
router.get("/id/:id", categoryController.getCategoryById.bind(categoryController));
router.get("/:slug", categoryController.getCategoryBySlug.bind(categoryController));

// Admin Category routes
const adminCategoryRouter = Router();

adminCategoryRouter.get("/", requirePermission("manage_categories"), categoryController.getAdminCategories.bind(categoryController));
adminCategoryRouter.post("/", requirePermission("manage_categories"), categoryController.createCategory.bind(categoryController));
adminCategoryRouter.put("/order", requirePermission("manage_categories"), categoryController.updateCategoriesOrder.bind(categoryController));
adminCategoryRouter.put("/:id", requirePermission("manage_categories"), categoryController.updateCategory.bind(categoryController));
adminCategoryRouter.delete("/:id", requirePermission("manage_categories"), categoryController.deleteCategory.bind(categoryController));

// Admin Area routes
const adminAreaRouter = Router();

adminAreaRouter.get("/", requirePermission("manage_areas"), areaController.getAreas.bind(areaController));
adminAreaRouter.post("/", requirePermission("manage_areas"), areaController.createArea.bind(areaController));
adminAreaRouter.put("/order", requirePermission("manage_areas"), areaController.updateAreaOrder.bind(areaController));
adminAreaRouter.get("/:id", requirePermission("manage_areas"), areaController.getAreaById.bind(areaController));
adminAreaRouter.put("/:id", requirePermission("manage_areas"), areaController.updateArea.bind(areaController));
adminAreaRouter.patch("/:id/toggle-status", requirePermission("manage_areas"), areaController.toggleAreaStatus.bind(areaController));
adminAreaRouter.delete("/:id", requirePermission("manage_areas"), areaController.deleteArea.bind(areaController));

// Admin Price routes
const adminPriceRouter = Router();

adminPriceRouter.get("/", requirePermission("manage_prices"), priceController.getPrices.bind(priceController));
adminPriceRouter.post("/", requirePermission("manage_prices"), priceController.createPrice.bind(priceController));
adminPriceRouter.put("/order", requirePermission("manage_prices"), priceController.updatePriceOrder.bind(priceController));
adminPriceRouter.get("/:id", requirePermission("manage_prices"), priceController.getPriceById.bind(priceController));
adminPriceRouter.put("/:id", requirePermission("manage_prices"), priceController.updatePrice.bind(priceController));
adminPriceRouter.patch("/:id/toggle-status", requirePermission("manage_prices"), priceController.togglePriceStatus.bind(priceController));
adminPriceRouter.delete("/:id", requirePermission("manage_prices"), priceController.deletePrice.bind(priceController));

export { router as categoryRouter, adminCategoryRouter, adminAreaRouter, adminPriceRouter };