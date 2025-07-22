import { Router, Express } from "express";
import { authenticateUser, authenticateAdmin } from "../middleware";
import { uploadS3 } from "../utils/s3Upload";
import {
  IndexController,
  AuthController,
  PostController,
  FavoriteController,
  PaymentController,
  LocationController,
  AiController,
  AreaController,
  CategoryController,
  PriceController,
  WalletController, // New controller
  AdminController, // Add admin controller
  ProjectController, // Add project controller
  PackageController, // Add package controller
  SidebarConfigController, // Add sidebar config controller
  NewsController, // Add news controller
} from "../controllers";
import { UploadController } from "../controllers/UploadController";
import { DeveloperController } from "../controllers/DeveloperController";
import { NotificationController } from "../controllers/NotificationController";
import newsRoutes from "./newsRoutes";

const router = Router();
const indexController = new IndexController();
const authController = new AuthController();
const postController = new PostController();
const favoriteController = new FavoriteController();
const paymentController = new PaymentController();
const locationController = new LocationController();
const aiController = new AiController();
const areaController = new AreaController();
const categoryController = new CategoryController();
const priceController = new PriceController();
const walletController = new WalletController(); // New controller instance
const projectController = new ProjectController(); // New project controller instance
const developerController = new DeveloperController(); // New developer controller instance
const uploadController = new UploadController(); // New upload controller instance
const packageController = new PackageController(); // New package controller instance
const sidebarConfigController = new SidebarConfigController(); // New sidebar config controller instance

export function setRoutes(app: Express) {
  // Trang chủ
  app.use("/", router);
  router.get("/", indexController.getIndex.bind(indexController));

  // Auth
  const authRouter = Router();
  app.use("/api/auth", authRouter);
  authRouter.post("/register", authController.register.bind(authController));
  authRouter.post("/login", authController.login.bind(authController));
  authRouter.post("/refresh", authController.refreshToken.bind(authController));
  authRouter.post("/logout", authController.logout.bind(authController));
  authRouter.post("/logout-all", authController.logoutAll.bind(authController));
  authRouter.get(
    "/profile",
    authenticateUser,
    authController.getProfile.bind(authController)
  );
  authRouter.put(
    "/profile",
    authenticateUser,
    authController.updateProfile.bind(authController)
  );
  authRouter.put(
    "/change-password",
    authenticateUser,
    authController.changePassword.bind(authController)
  );
  authRouter.delete(
    "/account",
    authenticateUser,
    authController.deleteAccount.bind(authController)
  );

  // Post
  const postRouter = Router();
  app.use("/api/posts", postRouter);
  postRouter.get("/", postController.getPosts.bind(postController));

  postRouter.get(
    "/my",
    authenticateUser,
    postController.getMyPosts.bind(postController)
  );
  //lấy bài viết theo apifiler
  postRouter.get("/search", postController.searchPosts.bind(postController));

  postRouter.get(
    "/user/:userId",
    authenticateUser,
    postController.getPostsByUser.bind(postController)
  );
  postRouter.get("/:postId", postController.getPostById.bind(postController));

  // Get similar posts
  postRouter.get(
    "/:postId/similar",
    postController.getSimilarPosts.bind(postController)
  );

  postRouter.post(
    "/",
    authenticateUser,
    uploadS3.array("images", 20),
    postController.createPost.bind(postController)
  );
  // Route để cập nhật toàn bộ bài đăng (chỉ dành cho admin)
  postRouter.put(
    "/:postId",
    authenticateUser,
    postController.updatePost.bind(postController)
  );

  // Route để user chỉnh sửa và gửi lại tin chờ duyệt
  postRouter.put(
    "/:postId/resubmit",
    authenticateUser,
    postController.resubmitPost.bind(postController)
  );

  // chỉnh sửa trạng thái bài viết
  postRouter.patch(
    "/:postId/status",
    postController.updatePostStatus.bind(postController)
  );

  // Admin endpoint để check expired posts
  postRouter.post(
    "/admin/check-expired",
    authenticateUser,
    postController.checkExpiredPosts.bind(postController)
  );

  // User endpoint để gia hạn post
  postRouter.post(
    "/:postId/extend",
    authenticateUser,
    postController.extendPost.bind(postController)
  );

  // Favorite
  const favoriteRouter = Router();
  app.use("/api/favorites", favoriteRouter);
  favoriteRouter.post(
    "/",
    authenticateUser,
    favoriteController.addToFavorites.bind(favoriteController)
  );
  favoriteRouter.delete(
    "/:postId",
    authenticateUser,
    favoriteController.removeFromFavorites.bind(favoriteController)
  );
  favoriteRouter.get(
    "/",
    authenticateUser,
    favoriteController.getFavorites.bind(favoriteController)
  );
  favoriteRouter.get(
    "/check/:postId",
    authenticateUser,
    favoriteController.checkFavoriteStatus.bind(favoriteController)
  );
  favoriteRouter.get(
    "/stats",
    authenticateUser,
    favoriteController.getFavoriteStats.bind(favoriteController)
  );

  // Payment
  const paymentRouter = Router();
  app.use("/api/payments", paymentRouter);

  // Các route thanh toán cần đăng nhập
  paymentRouter.post(
    "/vnpay/create-payment-url",
    authenticateUser,
    paymentController.createVNPayPaymentUrl.bind(paymentController)
  );
  paymentRouter.get(
    "/history",
    authenticateUser,
    paymentController.getPaymentHistory.bind(paymentController)
  );
  paymentRouter.get(
    "/details/:orderId",
    authenticateUser,
    paymentController.getPaymentDetails.bind(paymentController)
  );

  // Các route callback/public của VNPAY
  paymentRouter.get(
    "/vnpay/return",
    paymentController.processVNPayReturn.bind(paymentController)
  );
  paymentRouter.get(
    "/vnpay/ipn",
    paymentController.processVNPayIPN.bind(paymentController)
  );

  // Kiểm tra và cập nhật trạng thái thanh toán
  paymentRouter.get(
    "/check-status/:orderId",
    authenticateUser,
    paymentController.checkPaymentStatus.bind(paymentController)
  );

  // Thêm route mới để cập nhật trạng thái từ client-side
  paymentRouter.post(
    "/update-status/:orderId",
    authenticateUser,
    paymentController.updatePaymentStatus.bind(paymentController)
  );

  // Thêm route mới để lấy thông tin ví người dùng
  paymentRouter.get(
    "/wallet-info",
    authenticateUser,
    paymentController.getUserWalletInfo.bind(paymentController)
  );

  // Location
  const locationRouter = Router();
  app.use("/api/locations", locationRouter);

  locationRouter.get(
    "/provinces",
    locationController.getProvinces.bind(locationController)
  );
  locationRouter.get(
    "/names",
    locationController.getLocationNames.bind(locationController)
  );
  locationRouter.get(
    "/province/:slug",
    locationController.getProvinceBySlug.bind(locationController)
  );
  locationRouter.get(
    "/districts/:provinceCode",
    locationController.getDistricts.bind(locationController)
  );
  locationRouter.get(
    "/wards/:provinceCode",
    locationController.getWards.bind(locationController)
  );

  // Admin location management routes
  locationRouter.get(
    "/",
    authenticateAdmin,
    locationController.getProvincesWithChildren.bind(locationController)
  );

  // Province CRUD
  locationRouter.post(
    "/",
    authenticateAdmin,
    locationController.createProvince.bind(locationController)
  );
  locationRouter.put(
    "/:id",
    authenticateAdmin,
    locationController.updateProvince.bind(locationController)
  );
  locationRouter.delete(
    "/:id",
    authenticateAdmin,
    locationController.deleteProvince.bind(locationController)
  );

  // Ward CRUD
  locationRouter.post(
    "/:provinceId/wards",
    authenticateAdmin,
    locationController.createWard.bind(locationController)
  );
  locationRouter.put(
    "/wards/:id",
    authenticateAdmin,
    locationController.updateWard.bind(locationController)
  );
  locationRouter.delete(
    "/wards/:id",
    authenticateAdmin,
    locationController.deleteWard.bind(locationController)
  );

  // Upload routes
  const uploadRouter = Router();
  app.use("/api/upload", uploadRouter);

  // Upload single image (requires authentication)
  uploadRouter.post(
    "/image",
    authenticateUser,
    uploadController.uploadImage.bind(uploadController)
  );

  // Upload multiple images (requires authentication)
  uploadRouter.post(
    "/images",
    authenticateUser,
    uploadController.uploadImages.bind(uploadController)
  );

  // Delete image (requires authentication)
  uploadRouter.delete(
    "/delete",
    authenticateUser,
    uploadController.deleteImage.bind(uploadController)
  );

  // Project routes
  const projectRouter = Router();
  app.use("/api/projects", projectRouter);

  // Public project routes - ĐẶT CÁC ROUTE CỐ ĐỊNH TRƯỚC
  projectRouter.get(
    "/for-selection",
    projectController.getProjectsForSelection.bind(projectController)
  );
  projectRouter.get(
    "/admin/list",
    authenticateAdmin,
    projectController.getAdminProjects.bind(projectController)
  );
  projectRouter.get("/", projectController.getProjects.bind(projectController));

  // ĐẶT CÁC ROUTE DYNAMIC CUỐI
  projectRouter.get(
    "/:id",
    projectController.getProjectById.bind(projectController)
  );
  projectRouter.get(
    "/slug/:slug",
    projectController.getProjectBySlug.bind(projectController)
  );

  // Admin project routes
  projectRouter.post(
    "/admin",
    authenticateAdmin,
    projectController.createProject.bind(projectController)
  );
  projectRouter.put(
    "/admin/:id",
    authenticateAdmin,
    projectController.updateProject.bind(projectController)
  );
  projectRouter.delete(
    "/admin/:id",
    authenticateAdmin,
    projectController.deleteProject.bind(projectController)
  );
  // AI
  const aiRouter = Router();
  app.use("/api/ai", aiRouter);
  aiRouter.post(
    "/generate-title",
    authenticateUser,
    aiController.generateTitle.bind(aiController)
  );
  aiRouter.post(
    "/generate-description",
    authenticateUser,
    aiController.generateDescription.bind(aiController)
  );

  // Area
  const areaRouter = Router();
  app.use("/api/areas", areaRouter);
  areaRouter.get("/", areaController.getAllAreas.bind(areaController));
  areaRouter.get("/:id", areaController.getAreaById.bind(areaController));

  // Category
  const categoryRouter = Router();
  app.use("/api/categories", categoryRouter);
  categoryRouter.get(
    "/",
    categoryController.getCategories.bind(categoryController)
  );
  // lấy danh mục theo isProject
  categoryRouter.get(
    "/isProject/:isProject",
    categoryController.getCategoryByIsProject.bind(categoryController)
  );
  // lấy danh mục theo ID
  categoryRouter.get(
    "/id/:id",
    categoryController.getCategoryById.bind(categoryController)
  );
  categoryRouter.get(
    "/:slug",
    categoryController.getCategoryBySlug.bind(categoryController)
  );

  // Admin Category routes
  const adminCategoryRouter = Router();
  app.use("/api/admin/categories", adminCategoryRouter);

  // Get all categories for admin
  adminCategoryRouter.get(
    "/",
    authenticateAdmin,
    categoryController.getAdminCategories.bind(categoryController)
  );

  // Create new category
  adminCategoryRouter.post(
    "/",
    authenticateAdmin,
    categoryController.createCategory.bind(categoryController)
  );

  // Update category order
  adminCategoryRouter.put(
    "/order",
    authenticateAdmin,
    categoryController.updateCategoriesOrder.bind(categoryController)
  );

  // Update category
  adminCategoryRouter.put(
    "/:id",
    authenticateAdmin,
    categoryController.updateCategory.bind(categoryController)
  );

  // Delete category
  adminCategoryRouter.delete(
    "/:id",
    authenticateAdmin,
    categoryController.deleteCategory.bind(categoryController)
  );

  // Admin Area routes
  const adminAreaRouter = Router();
  app.use("/api/admin/areas", adminAreaRouter);

  // Get all areas for admin
  adminAreaRouter.get(
    "/",
    authenticateAdmin,
    areaController.getAreas.bind(areaController)
  );

  // Create new area
  adminAreaRouter.post(
    "/",
    authenticateAdmin,
    areaController.createArea.bind(areaController)
  );

  // Update area order
  adminAreaRouter.put(
    "/order",
    authenticateAdmin,
    areaController.updateAreaOrder.bind(areaController)
  );

  // Get area by ID
  adminAreaRouter.get(
    "/:id",
    authenticateAdmin,
    areaController.getAreaById.bind(areaController)
  );

  // Update area
  adminAreaRouter.put(
    "/:id",
    authenticateAdmin,
    areaController.updateArea.bind(areaController)
  );

  // Toggle area status
  adminAreaRouter.patch(
    "/:id/toggle-status",
    authenticateAdmin,
    areaController.toggleAreaStatus.bind(areaController)
  );

  // Delete area
  adminAreaRouter.delete(
    "/:id",
    authenticateAdmin,
    areaController.deleteArea.bind(areaController)
  );

  // Admin Price routes
  const adminPriceRouter = Router();
  app.use("/api/admin/prices", adminPriceRouter);

  // Get all prices for admin
  adminPriceRouter.get(
    "/",
    authenticateAdmin,
    priceController.getPrices.bind(priceController)
  );

  // Create new price
  adminPriceRouter.post(
    "/",
    authenticateAdmin,
    priceController.createPrice.bind(priceController)
  );

  // Update price order
  adminPriceRouter.put(
    "/order",
    authenticateAdmin,
    priceController.updatePriceOrder.bind(priceController)
  );

  // Get price by ID
  adminPriceRouter.get(
    "/:id",
    authenticateAdmin,
    priceController.getPriceById.bind(priceController)
  );

  // Update price
  adminPriceRouter.put(
    "/:id",
    authenticateAdmin,
    priceController.updatePrice.bind(priceController)
  );

  // Toggle price status
  adminPriceRouter.patch(
    "/:id/toggle-status",
    authenticateAdmin,
    priceController.togglePriceStatus.bind(priceController)
  );

  // Delete price
  adminPriceRouter.delete(
    "/:id",
    authenticateAdmin,
    priceController.deletePrice.bind(priceController)
  );

  // Price Range
  const priceRangeRouter = Router();
  app.use("/api/price-ranges", priceRangeRouter);
  priceRangeRouter.get("/", priceController.getAllPrices.bind(priceController));
  priceRangeRouter.get(
    "/type/:type",
    priceController.getPricesByType.bind(priceController)
  );
  priceRangeRouter.get(
    "/:slug",
    priceController.getPriceById.bind(priceController)
  );

  // Wallet routes - add new routes for wallet
  const walletRouter = Router();
  app.use("/api/wallet", walletRouter);

  walletRouter.get(
    "/info",
    authenticateUser,
    walletController.getWalletInfo.bind(walletController)
  );

  walletRouter.post(
    "/process-payment",
    authenticateUser,
    walletController.processPaymentUpdate.bind(walletController)
  );

  walletRouter.get(
    "/transactions",
    authenticateUser,
    walletController.getTransactionHistory.bind(walletController)
  );

  walletRouter.post(
    "/sync",
    authenticateUser,
    walletController.syncWalletWithPayments.bind(walletController)
  );

  // Admin-only route
  walletRouter.post(
    "/adjust",
    authenticateUser,
    walletController.adjustWalletBalance.bind(walletController)
  );

  // Post payment route
  walletRouter.post(
    "/deduct-for-post",
    authenticateUser,
    walletController.deductForPostPayment.bind(walletController)
  );

  // Admin routes
  const adminRouter = Router();
  app.use("/api/admin", adminRouter);

  // Admin statistics routes
  adminRouter.get("/stats", authenticateUser, AdminController.getAdminStats);
  adminRouter.get(
    "/recent-activities",
    authenticateUser,
    AdminController.getRecentActivities
  );
  adminRouter.get("/top-posts", authenticateUser, AdminController.getTopPosts);

  // Admin posts management routes
  adminRouter.get("/posts", authenticateUser, AdminController.getAdminPosts);
  adminRouter.get(
    "/posts/stats",
    authenticateUser,
    AdminController.getAdminPostsStats
  );
  adminRouter.get(
    "/posts/:id",
    authenticateUser,
    AdminController.getAdminPostById
  );
  adminRouter.put(
    "/posts/:id/approve",
    authenticateUser,
    AdminController.approvePost
  );
  adminRouter.put(
    "/posts/:id/reject",
    authenticateUser,
    AdminController.rejectPost
  );
  adminRouter.delete(
    "/posts/:id",
    authenticateUser,
    AdminController.deleteAdminPost
  );

  // Admin user management routes
  adminRouter.get("/users", authenticateUser, AdminController.getUsers);
  adminRouter.get(
    "/user-stats",
    authenticateUser,
    AdminController.getUserStats
  );
  adminRouter.get("/users/:id", authenticateUser, AdminController.getUserById);
  adminRouter.get(
    "/users/:id/posts",
    authenticateUser,
    AdminController.getUserPosts
  );
  adminRouter.get(
    "/users/:id/payments",
    authenticateUser,
    AdminController.getUserPayments
  );
  adminRouter.get(
    "/users/:id/logs",
    authenticateUser,
    AdminController.getUserLogs
  );
  adminRouter.put("/users/:id", authenticateUser, AdminController.updateUser);
  adminRouter.patch(
    "/users/:id/status",
    authenticateUser,
    AdminController.updateUserStatus
  );
  adminRouter.delete(
    "/users/:id",
    authenticateUser,
    AdminController.deleteUser
  );

  // Admin payment management routes
  adminRouter.get(
    "/payments",
    authenticateUser,
    AdminController.getAllPayments
  );

  // Admin notification management đã được bỏ
  // Chỉ giữ lại 3 loại thông báo tự động: PAYMENT, POST_APPROVED, POST_REJECTED

  // Developer routes
  const developerRouter = Router();
  app.use("/api/developers", developerRouter);

  // Public developer routes
  developerRouter.get(
    "/",
    developerController.getDevelopers.bind(developerController)
  );
  developerRouter.get(
    "/for-selection",
    developerController.getDevelopersForSelection.bind(developerController)
  );
  developerRouter.get(
    "/:id",
    developerController.getDeveloperById.bind(developerController)
  );

  // Admin developer routes
  developerRouter.get(
    "/admin/list",
    authenticateAdmin,
    developerController.getAdminDevelopers.bind(developerController)
  );
  developerRouter.post(
    "/",
    authenticateAdmin,
    developerController.createDeveloper.bind(developerController)
  );
  developerRouter.put(
    "/:id",
    authenticateAdmin,
    developerController.updateDeveloper.bind(developerController)
  );
  developerRouter.delete(
    "/:id",
    authenticateAdmin,
    developerController.deleteDeveloper.bind(developerController)
  );

  // Notification routes
  const notificationRouter = Router();
  app.use("/api/notifications", notificationRouter);

  // User notification routes
  notificationRouter.get(
    "/",
    authenticateUser,
    NotificationController.getNotifications
  );
  notificationRouter.get(
    "/unread-count",
    authenticateUser,
    NotificationController.getUnreadCount
  );
  notificationRouter.put(
    "/:id/read",
    authenticateUser,
    NotificationController.markAsRead
  );
  notificationRouter.put(
    "/read-all",
    authenticateUser,
    NotificationController.markAllAsRead
  );
  notificationRouter.delete(
    "/:id",
    authenticateUser,
    NotificationController.deleteNotification
  );

  // Package routes
  const packageRouter = Router();
  app.use("/api/packages", packageRouter);

  // Public routes - lấy packages active cho user
  packageRouter.get(
    "/",
    packageController.getActivePackages.bind(packageController)
  );

  // Admin routes
  const adminPackageRouter = Router();
  app.use("/api/admin/packages", adminPackageRouter);

  adminPackageRouter.get(
    "/",
    authenticateAdmin,
    packageController.getAllPackages.bind(packageController)
  );
  adminPackageRouter.post(
    "/",
    authenticateAdmin,
    packageController.createPackage.bind(packageController)
  );
  adminPackageRouter.get(
    "/:id",
    authenticateAdmin,
    packageController.getPackageById.bind(packageController)
  );
  adminPackageRouter.put(
    "/:id",
    authenticateAdmin,
    packageController.updatePackage.bind(packageController)
  );
  adminPackageRouter.delete(
    "/:id",
    authenticateAdmin,
    packageController.deletePackage.bind(packageController)
  );

  // Sidebar Configuration Routes
  adminRouter.get(
    "/sidebar-config",
    authenticateUser,
    sidebarConfigController.getSidebarConfig.bind(sidebarConfigController)
  );
  adminRouter.put(
    "/sidebar-config",
    authenticateUser,
    sidebarConfigController.updateSidebarConfig.bind(sidebarConfigController)
  );
  adminRouter.post(
    "/sidebar-config/reset",
    authenticateUser,
    sidebarConfigController.resetSidebarConfig.bind(sidebarConfigController)
  );
  adminRouter.get(
    "/sidebar-config/default",
    authenticateUser,
    sidebarConfigController.getDefaultSidebarConfig.bind(
      sidebarConfigController
    )
  );
  adminRouter.post(
    "/sidebar-config/create-default",
    authenticateAdmin,
    sidebarConfigController.createDefaultSidebarConfig.bind(
      sidebarConfigController
    )
  );

  // ===== NEWS ROUTES =====
  app.use("/api/news", newsRoutes);
}
