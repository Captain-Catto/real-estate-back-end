// Example: Updated routes với Zod validation middleware
import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import {
  validateBody,
  validateParams,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  userIdParamSchema,
} from "../validations";
import { authenticateToken } from "../middleware";

const router = Router();
const authController = new AuthController();

// Auth routes với Zod validation
router.post(
  "/register",
  validateBody(registerSchema), // Zod validation middleware
  authController.register
);

router.post(
  "/login",
  validateBody(loginSchema), // Zod validation middleware
  authController.login
);

router.post(
  "/change-password",
  authenticateToken,
  validateBody(changePasswordSchema), // Zod validation middleware
  authController.changePassword
);

router.put(
  "/profile",
  authenticateToken,
  validateBody(updateProfileSchema), // Zod validation middleware
  authController.updateProfile
);

router.get(
  "/profile/:id",
  authenticateToken,
  validateParams(userIdParamSchema), // Validate MongoDB ID in params
  authController.getProfile
);

export default router;

// Example: Property routes với validation
import { PropertyController } from "../controllers/PropertyController";
import {
  createPropertySchema,
  updatePropertySchema,
  propertySearchSchema,
  propertyIdParamSchema,
} from "../validations";

const propertyRouter = Router();
const propertyController = new PropertyController();

// Create property với full validation
propertyRouter.post(
  "/properties",
  authenticateToken,
  validateBody(createPropertySchema),
  propertyController.createProperty
);

// Update property
propertyRouter.put(
  "/properties/:id",
  authenticateToken,
  validateParams(propertyIdParamSchema),
  validateBody(updatePropertySchema),
  propertyController.updateProperty
);

// Search properties với query validation
propertyRouter.get(
  "/properties/search",
  validateQuery(propertySearchSchema),
  propertyController.searchProperties
);

// Get property by ID
propertyRouter.get(
  "/properties/:id",
  validateParams(propertyIdParamSchema),
  propertyController.getProperty
);

export { propertyRouter };

// Example: Advanced validation với multiple schemas
import { validateMultiple } from "../validations";

// Route với validation cho cả params, query và body
propertyRouter.put(
  "/properties/:id/status",
  authenticateToken,
  validateMultiple({
    params: propertyIdParamSchema,
    body: z.object({
      status: z.enum(["active", "inactive", "pending"]),
    }),
    query: z.object({
      reason: z.string().optional(),
    }),
  }),
  propertyController.updatePropertyStatus
);
