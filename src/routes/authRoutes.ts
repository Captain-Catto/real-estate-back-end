import { Router } from "express";
import { AuthController } from "../controllers";
import { authenticateUser } from "../middleware";
import {
  validateBody,
  validateParams,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  userIdParamSchema,
} from "../validations";

const router = Router();
const authController = new AuthController();

// Authentication routes
router.post(
  "/register",
  validateBody(registerSchema),
  authController.register.bind(authController)
);

router.post(
  "/login",
  validateBody(loginSchema),
  authController.login.bind(authController)
);

router.post("/refresh", authController.refreshToken.bind(authController));
router.post("/logout", authController.logout.bind(authController));
router.post("/logout-all", authController.logoutAll.bind(authController));

router.get(
  "/profile",
  authenticateUser,
  authController.getProfile.bind(authController)
);

router.put(
  "/profile",
  authenticateUser,
  validateBody(updateProfileSchema),
  authController.updateProfile.bind(authController)
);

router.put(
  "/change-password",
  authenticateUser,
  validateBody(changePasswordSchema),
  authController.changePassword.bind(authController)
);

router.delete(
  "/account",
  authenticateUser,
  authController.deleteAccount.bind(authController)
);

// Password Reset Routes
router.post(
  "/forgot-password",
  validateBody(resetPasswordRequestSchema),
  authController.forgotPassword.bind(authController)
);

router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

export default router;