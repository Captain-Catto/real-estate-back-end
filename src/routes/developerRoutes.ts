import { Router } from "express";
import { DeveloperController } from "../controllers/DeveloperController";
import { requirePermission } from "../middleware";

const router = Router();
const developerController = new DeveloperController();

// Public developer routes
router.get("/", developerController.getDevelopers.bind(developerController));
router.get("/for-selection", developerController.getDevelopersForSelection.bind(developerController));
router.get("/:id", developerController.getDeveloperById.bind(developerController));

// Admin developer routes
router.get("/admin/list", requirePermission("view_users"), developerController.getAdminDevelopers.bind(developerController));
router.post("/", requirePermission("create_user"), developerController.createDeveloper.bind(developerController));
router.put("/:id", requirePermission("edit_user"), developerController.updateDeveloper.bind(developerController));
router.delete("/:id", requirePermission("delete_user"), developerController.deleteDeveloper.bind(developerController));

export default router;