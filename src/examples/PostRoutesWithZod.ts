// Example: Post routes với Zod validation
import { Router } from "express";
import { PostController } from "../controllers/PostController";
import {
  validateBody,
  validateParams,
  validateQuery,
  validateMultiple,
  createPostSchema,
  updatePostSchema,
  postSearchSchema,
  postIdParamSchema,
  updatePostStatusSchema,
  resubmitPostSchema,
  extendPostSchema,
  bulkPostActionSchema,
} from "../validations";
import { authenticate } from "../middleware"; // Assuming auth middleware

const router = Router();
const postController = new PostController();

// Create new post với Zod validation
router.post(
  "/posts",
  authenticate, // Auth middleware first
  validateBody(createPostSchema), // Zod validation middleware
  postController.createPost
);

// Update post với validation cho cả params và body
router.put(
  "/posts/:id",
  authenticate,
  validateMultiple({
    params: postIdParamSchema,
    body: updatePostSchema,
  }),
  postController.updatePost
);

// Search/filter posts với query validation
router.get(
  "/posts/search",
  validateQuery(postSearchSchema),
  postController.searchPosts
);

// Get post by ID với params validation
router.get(
  "/posts/:id",
  validateParams(postIdParamSchema),
  postController.getPostById
);

// Update post status (Admin/Employee only)
router.patch(
  "/posts/:id/status",
  authenticate,
  validateMultiple({
    params: postIdParamSchema,
    body: updatePostStatusSchema,
  }),
  postController.updatePostStatus
);

// Resubmit post for approval
router.post(
  "/posts/:id/resubmit",
  authenticate,
  validateMultiple({
    params: postIdParamSchema,
    body: resubmitPostSchema,
  }),
  postController.resubmitPost
);

// Extend post expiry
router.post(
  "/posts/:id/extend",
  authenticate,
  validateMultiple({
    params: postIdParamSchema,
    body: extendPostSchema,
  }),
  postController.extendPost
);

// Bulk operations
router.post(
  "/posts/bulk-action",
  authenticate,
  validateBody(bulkPostActionSchema),
  postController.bulkPostAction
);

// Admin routes với additional validation
router.patch(
  "/admin/posts/:id/approve",
  authenticate,
  validateParams(postIdParamSchema),
  postController.approvePost
);

router.patch(
  "/admin/posts/:id/reject",
  authenticate,
  validateMultiple({
    params: postIdParamSchema,
    body: z.object({
      reason: z.string().min(10, "Lý do từ chối phải có ít nhất 10 ký tự"),
    }),
  }),
  postController.rejectPost
);

// User's own posts với pagination validation
router.get(
  "/user/posts",
  authenticate,
  validateQuery(
    z.object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
      status: z
        .enum(["draft", "pending", "active", "rejected", "expired"])
        .optional(),
      type: z.enum(["ban", "cho-thue"]).optional(),
    })
  ),
  postController.getUserPosts
);

export default router;

// Example: Implementing validation trong một route thực tế
import { z } from "zod";

// Custom validation cho specific endpoint
const customPostValidation = z
  .object({
    title: z.string().min(10).max(200),
    description: z.string().min(50),
    price: z.number().min(0),
    // Custom business logic validation
  })
  .refine(
    (data) => {
      // Custom validation: giá nhà phải hợp lý với loại nhà
      if (data.title.includes("villa") && data.price < 1000000000) {
        return false;
      }
      return true;
    },
    {
      message: "Giá villa phải trên 1 tỷ VNĐ",
      path: ["price"],
    }
  );

// Route với custom validation
router.post(
  "/posts/premium",
  authenticate,
  validateBody(customPostValidation),
  async (req, res) => {
    // Business logic với validated data
    const validatedData = req.body; // Type-safe!
    // ...
  }
);

// Example: File upload validation kết hợp với post data
const createPostWithImagesSchema = createPostSchema.extend({
  imageFiles: z
    .array(
      z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z
          .string()
          .regex(/^image\/(jpeg|jpg|png|gif)$/, "Chỉ chấp nhận file ảnh"),
        size: z.number().max(5 * 1024 * 1024, "File ảnh tối đa 5MB"),
      })
    )
    .min(1, "Phải có ít nhất 1 ảnh")
    .max(20, "Tối đa 20 ảnh"),
});

// Route với file upload validation
router.post(
  "/posts/with-upload",
  authenticate,
  multer().array("images", 20), // Multer middleware
  validateBody(createPostWithImagesSchema),
  postController.createPostWithImages
);
