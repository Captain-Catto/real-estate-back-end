import { Router } from "express";
import { UploadController } from "../controllers/UploadController";
import { authenticateUser } from "../middleware";

const router = Router();
const uploadController = new UploadController();

// Upload single image (requires authentication)
router.post(
  "/image",
  authenticateUser,
  uploadController.uploadImage.bind(uploadController)
);

// Upload multiple images (requires authentication)
router.post(
  "/images",
  authenticateUser,
  uploadController.uploadImages.bind(uploadController)
);

// Delete image (requires authentication)
router.delete(
  "/delete",
  authenticateUser,
  uploadController.deleteImage.bind(uploadController)
);

export default router;