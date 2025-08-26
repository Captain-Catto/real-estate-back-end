import { Router } from "express";
import { ProjectController } from "../controllers";
import { requirePermission } from "../middleware";

const router = Router();
const projectController = new ProjectController();

// Fixed routes first
router.get("/for-selection", projectController.getProjectsForSelection.bind(projectController));
router.get("/featured", projectController.getFeaturedProjects.bind(projectController));
router.get("/admin/list", requirePermission("view_projects"), projectController.getAdminProjects.bind(projectController));
router.get("/", projectController.getProjects.bind(projectController));

// Dynamic routes last
router.get("/:id", projectController.getProjectById.bind(projectController));
router.get("/slug/:slug", projectController.getProjectBySlug.bind(projectController));

// Admin project routes
router.post("/admin", requirePermission("create_project"), projectController.createProject.bind(projectController));
router.put("/admin/:id", requirePermission("edit_project"), projectController.updateProject.bind(projectController));
router.delete("/admin/:id", requirePermission("delete_project"), projectController.deleteProject.bind(projectController));
router.patch("/admin/:id/reorder-images", requirePermission("edit_project"), projectController.reorderProjectImages.bind(projectController));

export default router;