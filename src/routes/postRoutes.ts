import { Router } from "express";
import { PostController } from "../controllers";
import { authenticateUser } from "../middleware";
import { uploadS3 } from "../utils/s3Upload";

const router = Router();
const postController = new PostController();

// Public routes
router.get("/", postController.getPosts.bind(postController));
router.get("/featured", postController.getFeaturedPosts.bind(postController));
router.get("/search", postController.searchPosts.bind(postController));
router.get("/user/:userId", authenticateUser, postController.getPostsByUser.bind(postController));
router.get("/public/user/:userId", postController.getPublicPostsByUser.bind(postController));

// Authenticated routes (put specific routes before dynamic params)
router.get("/my", authenticateUser, postController.getMyPosts.bind(postController));

// Dynamic routes (must be after specific routes)
router.get("/:postId", postController.getPostById.bind(postController));
router.get("/:postId/similar", postController.getSimilarPosts.bind(postController));

router.post(
  "/",
  authenticateUser,
  uploadS3.array("images", 20),
  postController.createPost.bind(postController)
);

router.put(
  "/:postId",
  authenticateUser,
  postController.updatePost.bind(postController)
);

router.put(
  "/:postId/resubmit",
  authenticateUser,
  postController.resubmitPost.bind(postController)
);

router.delete(
  "/:postId",
  authenticateUser,
  postController.deletePost.bind(postController)
);

router.patch(
  "/:postId/status",
  postController.updatePostStatus.bind(postController)
);

// Admin routes
router.post(
  "/admin/check-expired",
  authenticateUser,
  postController.checkExpiredPosts.bind(postController)
);

// User routes
router.post(
  "/:postId/extend",
  authenticateUser,
  postController.extendPost.bind(postController)
);

router.post(
  "/:postId/view",
  postController.incrementViews.bind(postController)
);

export default router;