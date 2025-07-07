import { Router, Express } from "express";
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
  PriceRangeController,
  WalletController, // New controller
  AdminController, // Add admin controller
} from "../controllers";
import { authenticateUser } from "../middleware";
import { uploadS3 } from "../utils/s3Upload";

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
const priceRangeController = new PriceRangeController();
const walletController = new WalletController(); // New controller instance
const adminController = AdminController; // Use the AdminController object directly

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

  postRouter.post(
    "/",
    authenticateUser,
    uploadS3.array("images", 20),
    postController.createPost.bind(postController)
  );
  // chỉnh sửa trạng thái bài viết
  postRouter.patch(
    "/:postId/status",
    postController.updatePostStatus.bind(postController)
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
    "/province/:slug",
    locationController.getProvinceBySlug.bind(locationController)
  );
  locationRouter.get(
    "/districts/:provinceCode",
    locationController.getDistricts.bind(locationController)
  );
  locationRouter.get(
    "/wards/:provinceCode/:districtCode",
    locationController.getWards.bind(locationController)
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
  areaRouter.get("/", areaController.getAreas.bind(areaController));
  areaRouter.get("/:slug", areaController.getAreaBySlug.bind(areaController));

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
  categoryRouter.get(
    "/:slug",
    categoryController.getCategoryBySlug.bind(categoryController)
  );

  // Price Range
  const priceRangeRouter = Router();
  app.use("/api/price-ranges", priceRangeRouter);
  priceRangeRouter.get(
    "/",
    priceRangeController.getPriceRanges.bind(priceRangeController)
  );
  priceRangeRouter.get(
    "/type/:type",
    priceRangeController.getPriceRangeByType.bind(priceRangeController)
  );
  priceRangeRouter.get(
    "/:slug",
    priceRangeController.getPriceRangeBySlug.bind(priceRangeController)
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
}
