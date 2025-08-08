import { Router, Express } from "express";
import {
  authenticateUser,
  authenticateAdmin,
  requirePermission,
  requireAnyPermission,
} from "../middleware";
import { uploadS3 } from "../utils/s3Upload";
import paymentSchedulerRoutes from "./paymentSchedulerRoutes";
import sidebarRoutes from "./sidebarRoutes";
import permissionRoutes from "./permissionRoutes";
import statsRoutes, { publicRouter as statsPublicRouter } from "./statsRoutes";
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
  NewsController, // Add news controller
  HeaderSettingsController, // Add header settings controller
} from "../controllers";
import { UploadController } from "../controllers/UploadController";
import { DeveloperController } from "../controllers/DeveloperController";
import { NotificationController } from "../controllers/NotificationController";
import { NewsCategoryController } from "../controllers/NewsCategoryController";
import { ContactController } from "../controllers/ContactController";

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

  // User public routes
  const userRouter = Router();
  app.use("/api/users", userRouter);
  userRouter.get(
    "/public/:userId",
    authController.getUserPublicInfo.bind(authController)
  );

  // Post
  const postRouter = Router();
  app.use("/api/posts", postRouter);
  postRouter.get("/", postController.getPosts.bind(postController));

  // Get featured posts (VIP/Premium posts for homepage)
  postRouter.get(
    "/featured",
    postController.getFeaturedPosts.bind(postController)
  );

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

  // Public route for user posts (for user profile pages)
  postRouter.get(
    "/public/user/:userId",
    postController.getPublicPostsByUser.bind(postController)
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

  // Increment post views
  postRouter.post(
    "/:postId/view",
    postController.incrementViews.bind(postController)
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

  // Các route mới để lấy thông tin địa điểm từ slug
  locationRouter.get(
    "/location-by-slug/:provinceSlug/:wardSlug?",
    locationController.getLocationBySlug.bind(locationController)
  );

  locationRouter.get(
    "/breadcrumb-from-slug",
    locationController.getBreadcrumbFromSlug.bind(locationController)
  );

  // Admin location management routes
  locationRouter.get(
    "/",
    requirePermission("view_settings"),
    locationController.getProvincesWithChildren.bind(locationController)
  );

  // Province CRUD
  locationRouter.post(
    "/",
    requirePermission("edit_settings"),
    locationController.createProvince.bind(locationController)
  );
  locationRouter.put(
    "/:id",
    requirePermission("edit_settings"),
    locationController.updateProvince.bind(locationController)
  );
  locationRouter.delete(
    "/:id",
    requirePermission("edit_settings"),
    locationController.deleteProvince.bind(locationController)
  );

  // Ward CRUD
  locationRouter.post(
    "/:provinceId/wards",
    requirePermission("edit_settings"),
    locationController.createWard.bind(locationController)
  );
  locationRouter.put(
    "/wards/:id",
    requirePermission("edit_settings"),
    locationController.updateWard.bind(locationController)
  );
  locationRouter.delete(
    "/wards/:id",
    requirePermission("edit_settings"),
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
    "/featured",
    projectController.getFeaturedProjects.bind(projectController)
  );
  projectRouter.get(
    "/admin/list",
    requirePermission("view_projects"),
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
    requirePermission("create_project"),
    projectController.createProject.bind(projectController)
  );
  projectRouter.put(
    "/admin/:id",
    requirePermission("edit_project"),
    projectController.updateProject.bind(projectController)
  );
  projectRouter.delete(
    "/admin/:id",
    requirePermission("delete_project"),
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
  areaRouter.get(
    "/type/:type",
    areaController.getAreasByType.bind(areaController)
  );
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
    requirePermission("manage_categories"),
    categoryController.getAdminCategories.bind(categoryController)
  );

  // Create new category
  adminCategoryRouter.post(
    "/",
    requirePermission("manage_categories"),
    categoryController.createCategory.bind(categoryController)
  );

  // Update category order
  adminCategoryRouter.put(
    "/order",
    requirePermission("manage_categories"),
    categoryController.updateCategoriesOrder.bind(categoryController)
  );

  // Update category
  adminCategoryRouter.put(
    "/:id",
    requirePermission("manage_categories"),
    categoryController.updateCategory.bind(categoryController)
  );

  // Delete category
  adminCategoryRouter.delete(
    "/:id",
    requirePermission("manage_categories"),
    categoryController.deleteCategory.bind(categoryController)
  );

  // Admin Area routes
  const adminAreaRouter = Router();
  app.use("/api/admin/areas", adminAreaRouter);

  // Get all areas for admin
  adminAreaRouter.get(
    "/",
    requirePermission("manage_areas"),
    areaController.getAreas.bind(areaController)
  );

  // Create new area
  adminAreaRouter.post(
    "/",
    requirePermission("manage_areas"),
    areaController.createArea.bind(areaController)
  );

  // Update area order
  adminAreaRouter.put(
    "/order",
    requirePermission("manage_areas"),
    areaController.updateAreaOrder.bind(areaController)
  );

  // Get area by ID
  adminAreaRouter.get(
    "/:id",
    requirePermission("manage_areas"),
    areaController.getAreaById.bind(areaController)
  );

  // Update area
  adminAreaRouter.put(
    "/:id",
    requirePermission("manage_areas"),
    areaController.updateArea.bind(areaController)
  );

  // Toggle area status
  adminAreaRouter.patch(
    "/:id/toggle-status",
    requirePermission("manage_areas"),
    areaController.toggleAreaStatus.bind(areaController)
  );

  // Delete area
  adminAreaRouter.delete(
    "/:id",
    requirePermission("manage_areas"),
    areaController.deleteArea.bind(areaController)
  );

  // Admin Price routes
  const adminPriceRouter = Router();
  app.use("/api/admin/prices", adminPriceRouter);

  // Get all prices for admin
  adminPriceRouter.get(
    "/",
    requirePermission("manage_prices"),
    priceController.getPrices.bind(priceController)
  );

  // Create new price
  adminPriceRouter.post(
    "/",
    requirePermission("manage_prices"),
    priceController.createPrice.bind(priceController)
  );

  // Update price order
  adminPriceRouter.put(
    "/order",
    requirePermission("manage_prices"),
    priceController.updatePriceOrder.bind(priceController)
  );

  // Get price by ID
  adminPriceRouter.get(
    "/:id",
    requirePermission("manage_prices"),
    priceController.getPriceById.bind(priceController)
  );

  // Update price
  adminPriceRouter.put(
    "/:id",
    requirePermission("manage_prices"),
    priceController.updatePrice.bind(priceController)
  );

  // Toggle price status
  adminPriceRouter.patch(
    "/:id/toggle-status",
    requirePermission("manage_prices"),
    priceController.togglePriceStatus.bind(priceController)
  );

  // Delete price
  adminPriceRouter.delete(
    "/:id",
    requirePermission("manage_prices"),
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

  // Admin dashboard routes (basic dashboard data)
  adminRouter.get(
    "/stats",
    requirePermission("view_dashboard"),
    AdminController.getAdminStats
  );
  adminRouter.get(
    "/recent-activities",
    requirePermission("view_dashboard"),
    AdminController.getRecentActivities
  );
  adminRouter.get(
    "/top-posts",
    requirePermission("view_dashboard"),
    AdminController.getTopPosts
  );

  // Admin posts management routes
  adminRouter.get(
    "/posts",
    requirePermission("view_posts"),
    AdminController.getAdminPosts
  );
  adminRouter.get(
    "/posts/stats",
    requirePermission("view_posts"),
    AdminController.getAdminPostsStats
  );
  adminRouter.get(
    "/posts/:id",
    requirePermission("view_posts"),
    AdminController.getAdminPostById
  );
  adminRouter.put(
    "/posts/:id",
    requirePermission("edit_post"),
    AdminController.updateAdminPost
  );
  adminRouter.put(
    "/posts/:id/approve",
    requirePermission("approve_post"),
    AdminController.approvePost
  );
  adminRouter.put(
    "/posts/:id/reject",
    requirePermission("reject_post"),
    AdminController.rejectPost
  );
  adminRouter.delete(
    "/posts/:id",
    requirePermission("delete_post"),
    AdminController.deleteAdminPost
  );

  // Admin user management routes
  adminRouter.get(
    "/users",
    requirePermission("view_users"),
    AdminController.getUsers
  );
  adminRouter.get(
    "/user-stats",
    requirePermission("view_users"),
    AdminController.getUserStats
  );
  adminRouter.get(
    "/users/:id",
    requirePermission("view_users"),
    AdminController.getUserById
  );
  adminRouter.get(
    "/users/:id/posts",
    requirePermission("view_users"),
    AdminController.getUserPosts
  );
  adminRouter.get(
    "/users/:id/payments",
    requirePermission("view_users"),
    AdminController.getUserPayments
  );
  adminRouter.get(
    "/users/:id/logs",
    requirePermission("view_users"),
    AdminController.getUserLogs
  );
  adminRouter.put(
    "/users/:id",
    requirePermission("edit_user"),
    AdminController.updateUser
  );
  adminRouter.patch(
    "/users/:id/status",
    requirePermission("change_user_status"),
    AdminController.updateUserStatus
  );
  adminRouter.delete(
    "/users/:id",
    requirePermission("delete_user"),
    AdminController.deleteUser
  );

  // Admin payment management routes
  adminRouter.get(
    "/payments",
    requirePermission("view_transactions"),
    AdminController.getAllPayments
  );
  adminRouter.post(
    "/payments/cancel-expired",
    requirePermission("view_transactions"),
    AdminController.cancelExpiredPayments
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
    requirePermission("view_users"),
    developerController.getAdminDevelopers.bind(developerController)
  );
  developerRouter.post(
    "/",
    requirePermission("create_user"),
    developerController.createDeveloper.bind(developerController)
  );
  developerRouter.put(
    "/:id",
    requirePermission("edit_user"),
    developerController.updateDeveloper.bind(developerController)
  );
  developerRouter.delete(
    "/:id",
    requirePermission("delete_user"),
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

  // Header Settings - Public Routes
  const headerRouter = Router();
  app.use("/api/header", headerRouter);

  // Public route - get header menus for display (không cần authentication)
  headerRouter.get("/menus", HeaderSettingsController.getHeaderMenus);

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
    requirePermission("view_transactions"),
    packageController.getAllPackages.bind(packageController)
  );
  adminPackageRouter.post(
    "/",
    requirePermission("create_transaction"),
    packageController.createPackage.bind(packageController)
  );
  adminPackageRouter.get(
    "/:id",
    requirePermission("view_transactions"),
    packageController.getPackageById.bind(packageController)
  );
  adminPackageRouter.put(
    "/:id",
    requirePermission("edit_transaction"),
    packageController.updatePackage.bind(packageController)
  );
  adminPackageRouter.delete(
    "/:id",
    requirePermission("edit_transaction"),
    packageController.deletePackage.bind(packageController)
  );

  // Header Settings Routes
  adminRouter.get(
    "/header-settings",
    requirePermission("view_settings"),
    HeaderSettingsController.getHeaderMenus
  );
  adminRouter.post(
    "/header-settings",
    requirePermission("edit_settings"),
    HeaderSettingsController.createHeaderMenu
  );
  // Specific routes must come before parameterized routes
  adminRouter.put(
    "/header-settings/reorder",
    requirePermission("edit_settings"),
    HeaderSettingsController.updateMenuOrder
  );
  adminRouter.post(
    "/header-settings/reset",
    requirePermission("edit_settings"),
    HeaderSettingsController.resetToDefault
  );
  // Parameterized routes come after specific routes
  adminRouter.put(
    "/header-settings/:id",
    requirePermission("edit_settings"),
    HeaderSettingsController.updateHeaderMenu
  );
  adminRouter.delete(
    "/header-settings/:id",
    requirePermission("edit_settings"),
    HeaderSettingsController.deleteHeaderMenu
  );
  adminRouter.patch(
    "/header-settings/:id/toggle",
    requirePermission("edit_settings"),
    HeaderSettingsController.toggleMenuStatus
  );

  // ===== NEWS ROUTES =====
  const newsRouter = Router();
  app.use("/api/news", newsRouter);

  const newsController = new NewsController();
  const newsCategoryController = new NewsCategoryController();

  // ===== PUBLIC NEWS ROUTES =====

  // Get published news with pagination and filters
  // GET /api/news?page=1&limit=12&category=mua-ban&search=keyword&featured=true&hot=true
  newsRouter.get("/", newsController.getPublishedNews);

  // Get news categories with counts
  // GET /api/news/categories
  newsRouter.get("/categories", newsController.getNewsCategories);

  // Get featured news for homepage
  // GET /api/news/featured?limit=6
  newsRouter.get("/featured", newsController.getFeaturedNews);

  // Get hot news
  // GET /api/news/hot?limit=10
  newsRouter.get("/hot", newsController.getHotNews);

  // Get single news by slug
  // GET /api/news/slug/:slug
  newsRouter.get("/slug/:slug", newsController.getNewsBySlug);

  // ===== ADMIN NEWS ROUTES =====

  // Get all news for admin (with filters)
  // GET /api/news/admin?page=1&limit=20&status=all&category=all&author=userId&search=keyword
  newsRouter.get(
    "/admin",
    requirePermission("view_news"),
    newsController.getAdminNews
  );

  // Create new news
  // POST /api/news/admin
  newsRouter.post(
    "/admin",
    requirePermission("create_news"),
    newsController.createNews
  );

  // Get news statistics (admin only)
  // GET /api/news/admin/stats
  newsRouter.get(
    "/admin/stats",
    requirePermission("view_news"),
    newsController.getNewsStats
  );

  // ===== NEWS CATEGORY ADMIN ROUTES =====

  // GET /api/news/admin/categories
  newsRouter.get(
    "/admin/categories",
    requirePermission("manage_news_categories"),
    newsCategoryController.getAdminNewsCategories
  );

  // POST /api/news/admin/categories
  newsRouter.post(
    "/admin/categories",
    requirePermission("manage_news_categories"),
    newsCategoryController.createNewsCategory
  );

  // PUT /api/news/admin/categories/order
  newsRouter.put(
    "/admin/categories/order",
    requirePermission("manage_news_categories"),
    newsCategoryController.updateNewsCategoriesOrder
  );

  // PUT /api/news/admin/categories/:id
  newsRouter.put(
    "/admin/categories/:id",
    requirePermission("manage_news_categories"),
    newsCategoryController.updateNewsCategory
  );

  // DELETE /api/news/admin/categories/:id
  newsRouter.delete(
    "/admin/categories/:id",
    requirePermission("manage_news_categories"),
    newsCategoryController.deleteNewsCategory
  );

  // ===== DYNAMIC NEWS ROUTES (ĐẶT CUỐI CÙNG) =====

  // Get single news for editing
  // GET /api/news/admin/:id
  newsRouter.get(
    "/admin/:id",
    requirePermission("edit_news"),
    newsController.getNewsById
  );

  // Update news
  // PUT /api/news/admin/:id
  newsRouter.put(
    "/admin/:id",
    requirePermission("edit_news"),
    newsController.updateNews
  );

  // Delete news
  // DELETE /api/news/admin/:id
  newsRouter.delete(
    "/admin/:id",
    requirePermission("delete_news"),
    newsController.deleteNews
  );

  // Update news status (admin only)
  // PUT /api/news/admin/:id/status
  newsRouter.put(
    "/admin/:id/status",
    requirePermission("feature_news"),
    newsController.updateNewsStatus
  );

  // Payment Scheduler Routes (Admin only)
  app.use("/api/admin/payment-scheduler", paymentSchedulerRoutes);

  // Sidebar Configuration Routes
  app.use("/api/sidebar", sidebarRoutes);

  // Permission Routes
  app.use("/api/permissions", permissionRoutes);

  // Stats Routes (Admin only)
  app.use("/api/admin/stats", statsRoutes);

  // Public Stats Routes (for tracking page views)
  app.use("/api/stats", statsPublicRouter);

  // ===== CONTACT ROUTES =====
  const contactRouter = Router();
  app.use("/api", contactRouter);

  // Public route - Send contact message
  contactRouter.post("/contact", ContactController.createContactMessage);

  // Admin routes - Contact management
  contactRouter.get(
    "/admin/contact",
    requirePermission("view_settings"),
    ContactController.getContactMessages
  );
  contactRouter.get(
    "/admin/contact/stats",
    requirePermission("view_settings"),
    ContactController.getContactStats
  );
  contactRouter.get(
    "/admin/contact/:id",
    requirePermission("view_settings"),
    ContactController.getContactMessageById
  );
  contactRouter.put(
    "/admin/contact/:id/status",
    requirePermission("edit_settings"),
    ContactController.updateContactMessageStatus
  );
  contactRouter.post(
    "/admin/contact/:id/reply",
    requirePermission("edit_settings"),
    ContactController.replyToContactMessage
  );
  contactRouter.patch(
    "/admin/contact/bulk/status",
    requirePermission("edit_settings"),
    ContactController.bulkUpdateStatus
  );
  contactRouter.delete(
    "/admin/contact/:id",
    requirePermission("edit_settings"),
    ContactController.deleteContactMessage
  );
  contactRouter.post(
    "/admin/contact/logs",
    requirePermission("edit_settings"),
    ContactController.createContactLog
  );
  contactRouter.get(
    "/admin/contact/:contactId/logs",
    requirePermission("view_settings"),
    ContactController.getContactLogs
  );
  contactRouter.put(
    "/admin/contact/logs/:logId",
    requirePermission("edit_settings"),
    ContactController.updateContactLogNote
  );
}
