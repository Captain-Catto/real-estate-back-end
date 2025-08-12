// Example: PostController với Zod validation
import { Request, Response } from "express";
import { Post, Package, Category } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";

// Import Zod schemas
import {
  createPostSchema,
  updatePostSchema,
  postSearchSchema,
  postIdParamSchema,
  updatePostStatusSchema,
  resubmitPostSchema,
  extendPostSchema,
  bulkPostActionSchema,
  type CreatePostInput,
  type UpdatePostInput,
  type PostSearchQuery,
  type PostIdParam,
  type UpdatePostStatusInput,
  type ResubmitPostInput,
  type ExtendPostInput,
  type BulkPostActionInput,
} from "../validations";

export class PostControllerWithZod {
  // Create new post với Zod validation
  async createPost(req: AuthenticatedRequest, res: Response) {
    try {
      // Data đã được validate bởi middleware
      const validatedData = req.body as CreatePostInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Create new post với validated data
      const newPost = new Post({
        ...validatedData,
        author: new mongoose.Types.ObjectId(userId),
        createdAt: new Date(),
        updatedAt: new Date(),
        views: 0,
        // Set default values
        currency: validatedData.currency || "VND",
        package: validatedData.package || "free",
        legalDocs: validatedData.legalDocs || "Sổ đỏ/ Sổ hồng",
        furniture: validatedData.furniture || "Đầy đủ",
        priority: validatedData.priority || "normal",
        status: validatedData.status || "pending",
      });

      // Calculate expiry date based on package
      if (validatedData.package && validatedData.package !== "free") {
        const packageInfo = await Package.findOne({
          name: validatedData.package,
        });
        if (packageInfo) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + packageInfo.duration);
          newPost.expiredAt = expiryDate;
          newPost.packageId = packageInfo._id;
        }
      }

      await newPost.save();

      return res.status(201).json({
        success: true,
        message: "Tạo tin đăng thành công",
        data: {
          post: newPost,
        },
      });
    } catch (error) {
      console.error("Create post error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Update post với Zod validation
  async updatePost(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedParams = req.params as PostIdParam;
      const validatedData = req.body as UpdatePostInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const post = await Post.findById(validatedParams.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài đăng",
        });
      }

      // Check ownership
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền chỉnh sửa bài đăng này",
        });
      }

      // Update only provided fields
      Object.keys(validatedData).forEach((key) => {
        if (validatedData[key as keyof UpdatePostInput] !== undefined) {
          (post as any)[key] = validatedData[key as keyof UpdatePostInput];
        }
      });

      // When user edits, set status back to pending for review
      if (post.status !== "draft") {
        post.status = "pending";
        post.approvedAt = undefined;
        post.approvedBy = undefined;
      }

      post.updatedAt = new Date();
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Cập nhật bài đăng thành công. Bài đăng sẽ được xem xét lại.",
        data: { post },
      });
    } catch (error) {
      console.error("Update post error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Search posts với Zod validation
  async searchPosts(req: Request, res: Response) {
    try {
      // Query parameters đã được validate
      const validatedQuery = req.query as PostSearchQuery;

      // Build MongoDB query từ validated data
      const query: any = { status: "active" }; // Chỉ hiển thị bài đăng active

      if (validatedQuery.keyword) {
        query.$text = { $search: validatedQuery.keyword };
      }

      if (validatedQuery.type) {
        query.type = validatedQuery.type;
      }

      if (validatedQuery.category) {
        query.category = validatedQuery.category;
      }

      if (validatedQuery.province) {
        query["location.province"] = validatedQuery.province;
      }

      if (validatedQuery.ward) {
        query["location.ward"] = validatedQuery.ward;
      }

      // Price range
      if (validatedQuery.minPrice || validatedQuery.maxPrice) {
        query.price = {};
        if (validatedQuery.minPrice) query.price.$gte = validatedQuery.minPrice;
        if (validatedQuery.maxPrice) query.price.$lte = validatedQuery.maxPrice;
      }

      // Area range
      if (validatedQuery.minArea || validatedQuery.maxArea) {
        query.area = {};
        if (validatedQuery.minArea) query.area.$gte = validatedQuery.minArea;
        if (validatedQuery.maxArea) query.area.$lte = validatedQuery.maxArea;
      }

      // Bedrooms range
      if (validatedQuery.minBedrooms || validatedQuery.maxBedrooms) {
        query.bedrooms = {};
        if (validatedQuery.minBedrooms)
          query.bedrooms.$gte = validatedQuery.minBedrooms;
        if (validatedQuery.maxBedrooms)
          query.bedrooms.$lte = validatedQuery.maxBedrooms;
      }

      // Bathrooms range
      if (validatedQuery.minBathrooms || validatedQuery.maxBathrooms) {
        query.bathrooms = {};
        if (validatedQuery.minBathrooms)
          query.bathrooms.$gte = validatedQuery.minBathrooms;
        if (validatedQuery.maxBathrooms)
          query.bathrooms.$lte = validatedQuery.maxBathrooms;
      }

      // Other filters
      if (validatedQuery.houseDirection) {
        query.houseDirection = validatedQuery.houseDirection;
      }

      if (validatedQuery.balconyDirection) {
        query.balconyDirection = validatedQuery.balconyDirection;
      }

      if (validatedQuery.legalDocs) {
        query.legalDocs = validatedQuery.legalDocs;
      }

      if (validatedQuery.furniture) {
        query.furniture = validatedQuery.furniture;
      }

      // Pagination
      const page = validatedQuery.page || 1;
      const limit = validatedQuery.limit || 10;
      const skip = (page - 1) * limit;

      // Sorting
      const sortBy = validatedQuery.sortBy || "createdAt";
      const sortOrder = validatedQuery.sortOrder === "asc" ? 1 : -1;
      const sort = { [sortBy]: sortOrder };

      // Execute query
      const [posts, totalItems] = await Promise.all([
        Post.find(query)
          .populate("author", "username avatar")
          .populate("category")
          .sort(sort)
          .skip(skip)
          .limit(limit),
        Post.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Search posts error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Update post status (Admin/Employee only) với Zod validation
  async updatePostStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedParams = req.params as PostIdParam;
      const validatedData = req.body as UpdatePostStatusInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check admin/employee role
      if (req.user?.role !== "admin" && req.user?.role !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin và nhân viên mới có quyền thực hiện",
        });
      }

      const post = await Post.findById(validatedParams.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài đăng",
        });
      }

      const oldStatus = post.status;

      // Update status
      post.status = validatedData.status;

      // Handle status-specific logic
      if (validatedData.status === "active") {
        post.approvedAt = new Date();
        post.approvedBy = new mongoose.Types.ObjectId(userId);
        post.rejectedAt = undefined;
        post.rejectedBy = undefined;
        post.rejectedReason = undefined;
      } else if (validatedData.status === "rejected") {
        post.rejectedAt = new Date();
        post.rejectedBy = new mongoose.Types.ObjectId(userId);
        post.rejectedReason = validatedData.reason;
        post.approvedAt = undefined;
        post.approvedBy = undefined;
      }

      await post.save();

      return res.status(200).json({
        success: true,
        message: `Đã ${
          validatedData.status === "active" ? "phê duyệt" : "từ chối"
        } bài đăng`,
        data: { post },
      });
    } catch (error) {
      console.error("Update post status error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Resubmit post với Zod validation
  async resubmitPost(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedParams = req.params as PostIdParam;
      const validatedData = req.body as ResubmitPostInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const post = await Post.findById(validatedParams.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài đăng",
        });
      }

      // Check ownership
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền gửi lại bài đăng này",
        });
      }

      // Update post với validated data và set status to pending
      Object.keys(validatedData).forEach((key) => {
        if (validatedData[key as keyof ResubmitPostInput] !== undefined) {
          (post as any)[key] = validatedData[key as keyof ResubmitPostInput];
        }
      });

      post.status = "pending";
      post.updatedAt = new Date();

      // Clear rejection info when resubmitting
      post.rejectedAt = undefined;
      post.rejectedBy = undefined;
      // Keep rejectedReason for history

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Đã gửi lại bài đăng để xem xét",
        data: { post },
      });
    } catch (error) {
      console.error("Resubmit post error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Extend post với Zod validation
  async extendPost(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedParams = req.params as PostIdParam;
      const validatedData = req.body as ExtendPostInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const post = await Post.findById(validatedParams.id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài đăng",
        });
      }

      // Check ownership
      if (post.author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền gia hạn bài đăng này",
        });
      }

      // Get package info
      const packageInfo = await Package.findById(validatedData.packageId);
      if (!packageInfo) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy gói gia hạn",
        });
      }

      // Calculate new expiry date
      const currentExpiry = post.expiredAt || new Date();
      const now = new Date();
      const startDate = currentExpiry > now ? currentExpiry : now;
      const newExpiryDate = new Date(
        startDate.getTime() + validatedData.duration * 24 * 60 * 60 * 1000
      );

      // Update post
      post.expiredAt = newExpiryDate;
      post.packageId = packageInfo._id;

      // If post was expired, set back to pending
      if (post.status === "expired") {
        post.status = "pending";
      }

      await post.save();

      return res.status(200).json({
        success: true,
        message: "Gia hạn bài đăng thành công",
        data: {
          post: {
            _id: post._id,
            expiredAt: post.expiredAt,
            packageId: post.packageId,
            status: post.status,
          },
        },
      });
    } catch (error) {
      console.error("Extend post error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  // Bulk operations với Zod validation
  async bulkPostAction(req: AuthenticatedRequest, res: Response) {
    try {
      const validatedData = req.body as BulkPostActionInput;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Check admin/employee role for admin actions
      if (["approve", "reject", "delete"].includes(validatedData.action)) {
        if (req.user?.role !== "admin" && req.user?.role !== "employee") {
          return res.status(403).json({
            success: false,
            message: "Chỉ admin và nhân viên mới có quyền thực hiện",
          });
        }
      }

      const posts = await Post.find({ _id: { $in: validatedData.postIds } });

      if (posts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài đăng nào",
        });
      }

      // Apply action to all posts
      const updateData: any = {};

      switch (validatedData.action) {
        case "approve":
          updateData.status = "active";
          updateData.approvedAt = new Date();
          updateData.approvedBy = new mongoose.Types.ObjectId(userId);
          break;
        case "reject":
          updateData.status = "rejected";
          updateData.rejectedAt = new Date();
          updateData.rejectedBy = new mongoose.Types.ObjectId(userId);
          updateData.rejectedReason = validatedData.reason;
          break;
        case "delete":
          updateData.status = "deleted";
          break;
        case "feature":
          updateData.priority = "high";
          break;
        case "unfeature":
          updateData.priority = "normal";
          break;
      }

      const result = await Post.updateMany(
        { _id: { $in: validatedData.postIds } },
        { $set: updateData }
      );

      return res.status(200).json({
        success: true,
        message: `Đã thực hiện ${validatedData.action} cho ${result.modifiedCount} bài đăng`,
        data: {
          modifiedCount: result.modifiedCount,
          action: validatedData.action,
        },
      });
    } catch (error) {
      console.error("Bulk post action error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }
}
