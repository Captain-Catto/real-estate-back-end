import { Response } from "express";
import { Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";

export class PostController {
  // Create new post
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        title,
        description,
        content,
        price,
        location,
        category,
        tags /* ... */,
      } = req.body;

      // Lấy URL ảnh từ S3
      const images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => {
          images.push(file.location); // file.location là URL public trên S3
        });
      }

      console.log("Creating post with images:", images);

      const post = new Post({
        title,
        description,
        content,
        price: price || null,
        location: location || null,
        category,
        tags: tags || [],
        author: userId,
        images, // Lưu URL ảnh S3
        // ... các trường khác
      });

      await post.save();
      await post.populate("author", "username email avatar");

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        data: { post },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get all posts with pagination and filters
  async getPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const { category, status, search, author } = req.query;

      // Build filter object
      const filter: any = {};

      if (category) filter.category = category;
      if (status) filter.status = status;
      if (author && mongoose.Types.ObjectId.isValid(author as string)) {
        filter.author = author;
      }

      // Add text search if provided
      if (search) {
        filter.$text = { $search: search as string };
      }

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments(filter);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalItems: totalPosts,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get single post by ID
  async getPostById(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(postId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid post ID format",
        });
      }

      const post = await Post.findById(postId).populate(
        "author",
        "username email avatar"
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      res.json({
        success: true,
        data: {
          post,
        },
      });
    } catch (error) {
      console.error("Get post by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
