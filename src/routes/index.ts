import { Router, Express } from "express";
import { IndexController } from "../controllers";

// Import route modules
import authRoutes from "./authRoutes";
import userRoutes from "./userRoutes";
import postRoutes from "./postRoutes";
import favoriteRoutes from "./favoriteRoutes";
import paymentRoutes from "./paymentRoutes";
import locationRoutes from "./locationRoutes";
import uploadRoutes from "./uploadRoutes";
import walletRoutes from "./walletRoutes";
import adminRoutes from "./adminRoutes";
import areaRoutes from "./areaRoutes";
import priceRoutes from "./priceRoutes";
import { categoryRouter, adminCategoryRouter, adminAreaRouter, adminPriceRouter } from "./categoryRoutes";
import aiRoutes from "./aiRoutes";
import projectRoutes from "./projectRoutes";
import developerRoutes from "./developerRoutes";
import notificationRoutes from "./notificationRoutes";
import headerRoutes from "./headerRoutes";
import { packageRoutes, adminPackageRoutes } from "./packageRoutes";
import newsRoutes from "./newsRoutes";
import contactRoutes from "./contactRoutes";

// Import existing specialized routes
import paymentSchedulerRoutes from "./paymentSchedulerRoutes";
import sidebarRoutes from "./sidebarRoutes";
import permissionRoutes from "./permissionRoutes";
import statsRoutes, { publicRouter as statsPublicRouter } from "./statsRoutes";
import testRoutes from "./testRoutes";
import customerContactRoutes from "./customerContact";
import dashboardRoutes from "./dashboard";
import postExpiryRoutes from "./postExpiry";

const router = Router();

export function setRoutes(app: Express) {
  console.log("🚀 [Routes] Setting up routes...");

  // Home route
  const indexController = new IndexController();
  app.use("/", router);
  router.get("/", indexController.getIndex.bind(indexController));

  // Main API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/favorites", favoriteRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/wallet", walletRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/areas", areaRoutes);
  app.use("/api/price-ranges", priceRoutes);
  app.use("/api/categories", categoryRouter);
  app.use("/api/ai", aiRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/developers", developerRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/header", headerRoutes);
  app.use("/api/packages", packageRoutes);
  app.use("/api/news", newsRoutes);
  app.use("/api", contactRoutes);

  // Admin nested routes
  app.use("/api/admin/categories", adminCategoryRouter);
  app.use("/api/admin/areas", adminAreaRouter);
  app.use("/api/admin/prices", adminPriceRouter);
  app.use("/api/admin/packages", adminPackageRoutes);

  // Specialized routes
  app.use("/api/customer-contacts", customerContactRoutes);
  app.use("/api/admin/payment-scheduler", paymentSchedulerRoutes);
  app.use("/api/sidebar", sidebarRoutes);
  app.use("/api/permissions", permissionRoutes);
  app.use("/api/admin/stats", statsRoutes);
  app.use("/api/stats", statsPublicRouter);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/admin/post-expiry", postExpiryRoutes);
  app.use("/api/test", testRoutes);

  console.log("✅ [Routes] All routes have been set up successfully");
}