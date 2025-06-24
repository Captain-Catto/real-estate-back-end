import { Router, Express } from "express";
import {
  IndexController,
  AuthController,
  PostController,
  FavoriteController,
  PaymentController,
} from "../controllers";
import { authenticateUser } from "../middleware";
import { uploadS3 } from "../utils/s3Upload";

const router = Router();
const indexController = new IndexController();
const authController = new AuthController();
const postController = new PostController();
const favoriteController = new FavoriteController();
const paymentController = new PaymentController();

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
  postRouter.get("/:postId", postController.getPostById.bind(postController));
  postRouter.post(
    "/",
    authenticateUser,
    uploadS3.array("images", 20),
    postController.createPost.bind(postController)
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
    "/:orderId",
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
  paymentRouter.get(
    "/check-status/:orderId",
    paymentController.checkPaymentStatus.bind(paymentController)
  );
}
