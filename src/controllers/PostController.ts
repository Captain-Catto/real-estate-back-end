import { Response } from "express";
import { Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { LocationModel } from "../models/Location";

export class PostController {
  // Create new post
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        type,
        title,
        description,
        content,
        price,
        location,
        category,
        tags,
        package: postPackage,
      } = req.body;
      console.log("req.body", req.body);
      console.log("location", location);
      // Lấy URL ảnh từ S3
      const images: string[] = [];
      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file: any) => {
          images.push(file.location); // file.location là URL public trên S3
        });
      }

      let parsedLocation = location;
      if (typeof location === "string") {
        try {
          parsedLocation = JSON.parse(location);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: "Định dạng location không hợp lệ",
          });
        }
      }

      if (
        !parsedLocation ||
        !parsedLocation.province ||
        !parsedLocation.district ||
        !parsedLocation.ward
      ) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin địa chỉ (province, district, ward)",
        });
      }

      console.log("Creating post with images:", images);

      const post = new Post({
        type,
        title,
        description,
        content,
        price: price || null,
        location: parsedLocation || null,
        category,
        tags: tags || [],
        author: userId,
        images, // Lưu URL ảnh S3
        package: postPackage || null,
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

      // Nếu location là code, tìm name trong LocationModel
      let locationWithName = post.location;

      const province = await LocationModel.findOne({
        code: Number(post.location.province),
      });
      const district = province?.districts.find(
        (d: any) => d.code === Number(post.location.district)
      );
      const ward = district?.wards.find(
        (w: any) => w.code === Number(post.location.ward)
      );

      locationWithName = {
        province: province?.name || post.location.province,
        district: district?.name || post.location.district,
        ward: ward?.name || post.location.ward,
        street: post.location.street || "",
      };

      res.json({
        success: true,
        data: {
          post: {
            ...post.toObject(),
            location: locationWithName,
          },
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

  // Lấy danh sách bài đăng của người dùng hiện tại
  async getMyPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const posts = await Post.find({ author: userId })
        .populate("author", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments({ author: userId });

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
      console.error("Get my posts error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Lấy danh sách bài đăng của user bất kỳ (chỉ cho admin)
  async getPostsByUser(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }
      const userId = req.params.userId || req.query.userId;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
        return res.status(400).json({
          success: false,
          message: "Invalid or missing userId",
        });
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const posts = await Post.find({ author: userId })
        .populate("author", "username email avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments({ author: userId });

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
      console.error("Get posts by user error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
