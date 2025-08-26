import { Router } from "express";
import { HeaderSettingsController } from "../controllers";

const router = Router();

// Public route - get header menus for display (không cần authentication)
router.get("/menus", HeaderSettingsController.getHeaderMenus);

export default router;