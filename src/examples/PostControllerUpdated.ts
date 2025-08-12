import { Request, Response } from "express";
import { Post } from "../models/Post";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import {
  createPostSchema,
  updatePostSchema,
  postSearchSchema,
  postIdParamSchema,
  updatePostStatusSchema,
  type CreatePostInput,
  type UpdatePostInput,
  type PostSearchQuery,
  type PostIdParam,
  type UpdatePostStatusInput,
} from "../validations/postValidation";

/**
 * Ví dụ sử dụng Zod validation trong PostController
 * Dựa trên model Post.ts đã được cập nhật
 */
export class PostControllerExample {
  // POST /api/posts - Tạo bài đăng mới
  static createPost = [
    validateBody(createPostSchema),
    async (req: Request<{}, {}, CreatePostInput>, res: Response) => {
      try {
        const postData = req.body;

        // Tự động set author từ JWT token (middleware auth sẽ set req.user)
        if (req.user) {
          postData.author = req.user.id;
        }

        // Set default values nếu không có
        postData.status = postData.status || "pending";
        postData.package = postData.package || "free";
        postData.priority = postData.priority || "normal";
        postData.views = 0;

        const newPost = new Post(postData);
        await newPost.save();

        // Populate author và category info
        await newPost.populate(["author", "category"]);

        res.status(201).json({
          success: true,
          message: "Tạo bài đăng thành công",
          data: newPost,
        });
      } catch (error) {
        console.error("Create post error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi tạo bài đăng",
        });
      }
    },
  ];

  // PUT /api/posts/:id - Cập nhật bài đăng
  static updatePost = [
    validateParams(postIdParamSchema),
    validateBody(updatePostSchema),
    async (req: Request<PostIdParam, {}, UpdatePostInput>, res: Response) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        // Chỉ cho phép author hoặc admin update
        const post = await Post.findById(id);
        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy bài đăng",
          });
        }

        // Check permission (giả sử có middleware auth)
        if (
          post.author.toString() !== req.user?.id &&
          req.user?.role !== "admin"
        ) {
          return res.status(403).json({
            success: false,
            message: "Không có quyền chỉnh sửa bài đăng này",
          });
        }

        // Remove undefined values
        const filteredData = Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        );

        const updatedPost = await Post.findByIdAndUpdate(id, filteredData, {
          new: true,
          runValidators: true,
        }).populate(["author", "category"]);

        res.json({
          success: true,
          message: "Cập nhật bài đăng thành công",
          data: updatedPost,
        });
      } catch (error) {
        console.error("Update post error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi cập nhật bài đăng",
        });
      }
    },
  ];

  // GET /api/posts - Tìm kiếm và lọc bài đăng
  static searchPosts = [
    validateQuery(postSearchSchema),
    async (req: Request<{}, {}, {}, PostSearchQuery>, res: Response) => {
      try {
        const {
          keyword,
          type,
          category,
          province,
          ward,
          street,
          minPrice,
          maxPrice,
          minArea,
          maxArea,
          minBedrooms,
          maxBedrooms,
          minBathrooms,
          maxBathrooms,
          houseDirection,
          balconyDirection,
          legalDocs,
          furniture,
          status,
          package: packageType,
          priority,
          tags,
          startDate,
          endDate,
          authorId,
          project,
          page = 1,
          limit = 20,
          sortBy,
          sortOrder,
        } = req.query;

        // Build query object
        const query: any = {};

        // Text search
        if (keyword) {
          query.$text = { $search: keyword };
        }

        // Basic filters
        if (type) query.type = type;
        if (category) query.category = category;
        if (status) query.status = status;
        if (packageType) query.package = packageType;
        if (priority) query.priority = priority;
        if (authorId) query.author = authorId;
        if (project) query.project = project;

        // Location filters
        if (province) query["location.province"] = province;
        if (ward) query["location.ward"] = ward;
        if (street)
          query["location.street"] = { $regex: street, $options: "i" };

        // Price range
        if (minPrice || maxPrice) {
          query.price = {};
          if (minPrice) query.price.$gte = minPrice;
          if (maxPrice) query.price.$lte = maxPrice;
        }

        // Area range
        if (minArea || maxArea) {
          query.area = {};
          if (minArea) query.area.$gte = minArea;
          if (maxArea) query.area.$lte = maxArea;
        }

        // Room filters
        if (minBedrooms || maxBedrooms) {
          query.bedrooms = {};
          if (minBedrooms) query.bedrooms.$gte = minBedrooms;
          if (maxBedrooms) query.bedrooms.$lte = maxBedrooms;
        }

        if (minBathrooms || maxBathrooms) {
          query.bathrooms = {};
          if (minBathrooms) query.bathrooms.$gte = minBathrooms;
          if (maxBathrooms) query.bathrooms.$lte = maxBathrooms;
        }

        // Direction filters
        if (houseDirection) query.houseDirection = houseDirection;
        if (balconyDirection) query.balconyDirection = balconyDirection;

        // Other filters
        if (legalDocs) query.legalDocs = legalDocs;
        if (furniture) query.furniture = furniture;

        // Tags filter
        if (tags && tags.length > 0) {
          query.tags = { $in: tags };
        }

        // Date range
        if (startDate || endDate) {
          query.createdAt = {};
          if (startDate) query.createdAt.$gte = new Date(startDate);
          if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Build sort object
        const sort: any = {};
        if (sortBy) {
          sort[sortBy] = sortOrder === "asc" ? 1 : -1;
        } else {
          // Default sort: priority first, then creation date
          sort.priority = -1;
          sort.createdAt = -1;
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;

        const [posts, total] = await Promise.all([
          Post.find(query)
            .populate(["author", "category", "project"])
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
          Post.countDocuments(query),
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
          success: true,
          message: "Lấy danh sách bài đăng thành công",
          data: {
            posts,
            pagination: {
              page,
              limit,
              total,
              totalPages,
              hasNext: page < totalPages,
              hasPrev: page > 1,
            },
          },
        });
      } catch (error) {
        console.error("Search posts error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi tìm kiếm bài đăng",
        });
      }
    },
  ];

  // PUT /api/admin/posts/:id/status - Admin cập nhật trạng thái
  static updatePostStatus = [
    validateParams(postIdParamSchema),
    validateBody(updatePostStatusSchema),
    async (
      req: Request<PostIdParam, {}, UpdatePostStatusInput>,
      res: Response
    ) => {
      try {
        const { id } = req.params;
        const { status, reason, approvedBy, rejectedBy } = req.body;

        const post = await Post.findById(id);
        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy bài đăng",
          });
        }

        // Update status và related fields
        post.status = status;

        if (status === "active") {
          post.approvedAt = new Date();
          post.approvedBy = approvedBy || req.user?.id;
          // Clear rejection data
          post.rejectedAt = undefined;
          post.rejectedBy = undefined;
          post.rejectedReason = undefined;
        } else if (status === "rejected") {
          post.rejectedAt = new Date();
          post.rejectedBy = rejectedBy || req.user?.id;
          post.rejectedReason = reason;
          // Clear approval data
          post.approvedAt = undefined;
          post.approvedBy = undefined;
        }

        await post.save();

        // TODO: Send notification to post author
        // await notificationService.notifyPostStatusChange(post);

        res.json({
          success: true,
          message: `${
            status === "active" ? "Duyệt" : "Từ chối"
          } bài đăng thành công`,
          data: post,
        });
      } catch (error) {
        console.error("Update post status error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi cập nhật trạng thái bài đăng",
        });
      }
    },
  ];

  // GET /api/posts/:id - Lấy chi tiết bài đăng
  static getPostDetails = [
    validateParams(postIdParamSchema),
    async (req: Request<PostIdParam>, res: Response) => {
      try {
        const { id } = req.params;

        const post = await Post.findById(id).populate([
          { path: "author", select: "fullName email phone avatar" },
          { path: "category", select: "name description" },
          { path: "project", select: "name location developer" },
        ]);

        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy bài đăng",
          });
        }

        // Increment view count (có thể làm async để không ảnh hưởng response time)
        Post.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

        res.json({
          success: true,
          message: "Lấy thông tin bài đăng thành công",
          data: post,
        });
      } catch (error) {
        console.error("Get post details error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi lấy thông tin bài đăng",
        });
      }
    },
  ];

  // DELETE /api/posts/:id - Xóa bài đăng
  static deletePost = [
    validateParams(postIdParamSchema),
    async (req: Request<PostIdParam>, res: Response) => {
      try {
        const { id } = req.params;

        const post = await Post.findById(id);
        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy bài đăng",
          });
        }

        // Check permission
        if (
          post.author.toString() !== req.user?.id &&
          req.user?.role !== "admin"
        ) {
          return res.status(403).json({
            success: false,
            message: "Không có quyền xóa bài đăng này",
          });
        }

        // Soft delete bằng cách update status
        post.status = "deleted";
        await post.save();

        res.json({
          success: true,
          message: "Xóa bài đăng thành công",
        });
      } catch (error) {
        console.error("Delete post error:", error);
        res.status(500).json({
          success: false,
          message: "Lỗi server khi xóa bài đăng",
        });
      }
    },
  ];
}
