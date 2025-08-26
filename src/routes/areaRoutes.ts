import { Router } from "express";
import { AreaController } from "../controllers";

const router = Router();
const areaController = new AreaController();

// Public Area routes
router.get("/", areaController.getAllAreas.bind(areaController));
router.get("/type/:type", areaController.getAreasByType.bind(areaController));
router.get("/:id", areaController.getAreaById.bind(areaController));

export default router;