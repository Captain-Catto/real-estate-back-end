import { Request, Response } from "express";
import { Post } from "../models/Post";
import {
  createPostSchema,
  updatePostSchema,
  postSearchSchema,
  updatePostStatusSchema,
  postParamsSchema,
} from "../validations/postValidation";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../middleware/validation";

export class PostController {
  // Tạo post mới
  static createPost = [
    validateBody(createPostSchema),
    async (req: Request, res: Response) => {
      try {
        const validatedData = req.body; // Đã được validate bởi middleware

        // Thêm author từ user đã authenticated
        const postData = {
          ...validatedData,
          author: req.user._id, // Giả sử có middleware auth set req.user
        };

        const post = new Post(postData);
        await post.save();

        res.status(201).json({
          success: true,
          message: "Tạo tin đăng thành công",
          data: post,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi server",
          error: error.message,
        });
      }
    },
  ];

  // Cập nhật post
  static updatePost = [
    validateParams(postParamsSchema),
    validateBody(updatePostSchema.omit({ id: true })), // Loại bỏ id từ body vì đã có trong params
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        // Kiểm tra quyền sở hữu hoặc admin
        const existingPost = await Post.findById(id);
        if (!existingPost) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tin đăng",
          });
        }

        // Kiểm tra quyền (chỉ author hoặc admin mới được sửa)
        if (
          existingPost.author.toString() !== req.user._id.toString() &&
          req.user.role !== "admin"
        ) {
          return res.status(403).json({
            success: false,
            message: "Không có quyền chỉnh sửa tin đăng này",
          });
        }

        const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

        res.json({
          success: true,
          message: "Cập nhật tin đăng thành công",
          data: updatedPost,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi server",
          error: error.message,
        });
      }
    },
  ];

  // Tìm kiếm posts
  static searchPosts = [
    validateQuery(postSearchSchema),
    async (req: Request, res: Response) => {
      try {
        const {
          type,
          category,
          province,
          ward,
          minPrice,
          maxPrice,
          minArea,
          maxArea,
          bedrooms,
          bathrooms,
          status,
          priority,
          package: packageType,
          author,
          project,
          keyword,
          page,
          limit,
          sortBy,
          sortOrder,
        } = req.query;

        // Xây dựng query filter
        const filter: any = {};

        if (type) filter.type = type;
        if (category) filter.category = category;
        if (province) filter["location.province"] = province;
        if (ward) filter["location.ward"] = ward;
        if (bedrooms) filter.bedrooms = bedrooms;
        if (bathrooms) filter.bathrooms = bathrooms;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;
        if (packageType) filter.package = packageType;
        if (author) filter.author = author;
        if (project) filter.project = project;

        // Xử lý price range
        if (minPrice || maxPrice) {
          filter.price = {};
          if (minPrice) filter.price.$gte = minPrice;
          if (maxPrice) filter.price.$lte = maxPrice;
        }

        // Xử lý area range
        if (minArea || maxArea) {
          filter.area = {};
          if (minArea) filter.area.$gte = minArea;
          if (maxArea) filter.area.$lte = maxArea;
        }

        // Xử lý keyword search
        if (keyword) {
          filter.$text = { $search: keyword };
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Sort
        const sortObj: any = {};
        sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Execute query
        const posts = await Post.find(filter)
          .populate("category", "name")
          .populate("author", "name email")
          .populate("project", "name")
          .sort(sortObj)
          .skip(skip)
          .limit(limit);

        const total = await Post.countDocuments(filter);

        res.json({
          success: true,
          data: {
            posts,
            pagination: {
              current: page,
              total: Math.ceil(total / limit),
              count: posts.length,
              totalItems: total,
            },
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi server",
          error: error.message,
        });
      }
    },
  ];

  // Cập nhật trạng thái post (admin only)
  static updatePostStatus = [
    validateBody(updatePostStatusSchema),
    async (req: Request, res: Response) => {
      try {
        // Kiểm tra quyền admin
        if (req.user.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Chỉ admin mới có quyền thực hiện hành động này",
          });
        }

        const { id, status, rejectedReason } = req.body;

        const updateData: any = {
          status,
          updatedAt: new Date(),
        };

        // Xử lý theo từng trạng thái
        switch (status) {
          case "active":
            updateData.approvedAt = new Date();
            updateData.approvedBy = req.user._id;
            break;
          case "rejected":
            updateData.rejectedAt = new Date();
            updateData.rejectedBy = req.user._id;
            updateData.rejectedReason = rejectedReason;
            break;
          case "expired":
            updateData.expiredAt = new Date();
            break;
        }

        const updatedPost = await Post.findByIdAndUpdate(id, updateData, {
          new: true,
          runValidators: true,
        });

        if (!updatedPost) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tin đăng",
          });
        }

        res.json({
          success: true,
          message: `Cập nhật trạng thái tin đăng thành ${status} thành công`,
          data: updatedPost,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi server",
          error: error.message,
        });
      }
    },
  ];

  // Lấy chi tiết post
  static getPostById = [
    validateParams(postParamsSchema),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const post = await Post.findById(id)
          .populate("category", "name")
          .populate("author", "name email phone")
          .populate("project", "name location");

        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Không tìm thấy tin đăng",
          });
        }

        // Tăng view count
        await Post.findByIdAndUpdate(id, { $inc: { views: 1 } });

        res.json({
          success: true,
          data: post,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: "Lỗi server",
          error: error.message,
        });
      }
    },
  ];
}
