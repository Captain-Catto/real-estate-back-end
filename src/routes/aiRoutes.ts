import { Router } from "express";
import { AiController } from "../controllers";
import { authenticateUser } from "../middleware";

const router = Router();
const aiController = new AiController();

router.post("/generate-title", authenticateUser, aiController.generateTitle.bind(aiController));
router.post("/generate-description", authenticateUser, aiController.generateDescription.bind(aiController));

export default router;