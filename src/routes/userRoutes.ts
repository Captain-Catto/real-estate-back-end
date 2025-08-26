import { Router } from "express";
import { AuthController } from "../controllers";
import { validateParams, userIdParamSchema } from "../validations";

const router = Router();
const authController = new AuthController();

// Public user routes
router.get(
  "/public/:id",
  validateParams(userIdParamSchema),
  authController.getUserPublicInfo.bind(authController)
);

export default router;