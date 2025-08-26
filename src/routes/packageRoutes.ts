import { Router } from "express";
import { PackageController } from "../controllers";
import { requirePermission } from "../middleware";

const publicRouter = Router();
const adminRouter = Router();
const packageController = new PackageController();

// Public routes - lấy packages active cho user
publicRouter.get("/", packageController.getActivePackages.bind(packageController));

// Admin routes
adminRouter.get("/", requirePermission("view_transactions"), packageController.getAllPackages.bind(packageController));
adminRouter.post("/", requirePermission("create_transaction"), packageController.createPackage.bind(packageController));
adminRouter.put("/display-orders", requirePermission("edit_transaction"), packageController.updateDisplayOrders.bind(packageController));
adminRouter.get("/:id", requirePermission("view_transactions"), packageController.getPackageById.bind(packageController));
adminRouter.put("/:id", requirePermission("edit_transaction"), packageController.updatePackage.bind(packageController));
adminRouter.delete("/:id", requirePermission("edit_transaction"), packageController.deletePackage.bind(packageController));

export { publicRouter as packageRoutes, adminRouter as adminPackageRoutes };