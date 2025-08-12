// Example: Simple implementation trong route hiện tại
// File: src/routes/postRoutes.ts

import { Router } from "express";
import { PostController } from "../controllers/PostController";
import { validateBody, createPostSchema } from "../validations";
import { authenticate } from "../middleware/authenticate";

const router = Router();
const postController = new PostController();

// BEFORE: Route cũ không có validation
// router.post('/posts', authenticate, postController.createPost);

// AFTER: Route mới với Zod validation
router.post(
  "/posts",
  authenticate, // 1. Auth middleware
  validateBody(createPostSchema), // 2. Zod validation middleware
  postController.createPost // 3. Controller
);

export default router;

/* 
TRONG CONTROLLER:

// BEFORE: Manual validation
async createPost(req: AuthenticatedRequest, res: Response) {
  try {
    const { title, description, price, area } = req.body;
    
    // Manual validation
    if (!title || title.length < 10) {
      return res.status(400).json({
        message: "Title must be at least 10 characters"
      });
    }
    
    if (!description || description.length < 50) {
      return res.status(400).json({
        message: "Description must be at least 50 characters"
      });
    }
    
    if (!price || price < 0) {
      return res.status(400).json({
        message: "Price must be positive"
      });
    }
    
    // More validation...
    
    // Business logic
    const post = new Post({ title, description, price, area });
    await post.save();
    
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// AFTER: With Zod validation
async createPost(req: AuthenticatedRequest, res: Response) {
  try {
    // Data đã được validate! No manual validation needed!
    const { title, description, price, area, images, location } = req.body;
    
    // Direct business logic - data is already validated and type-safe
    const post = new Post({
      title,
      description, 
      price,
      area,
      images,
      location,
      author: req.user.userId,
      status: 'pending'
    });
    
    await post.save();
    
    res.json({ 
      success: true, 
      message: "Tạo tin đăng thành công",
      data: post 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Lỗi server" 
    });
  }
}
*/
