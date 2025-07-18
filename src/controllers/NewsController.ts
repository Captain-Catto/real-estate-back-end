import { Request, Response } from "express";
import { News, INews } from "../models/News";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../types";
import mongoose from "mongoose";

export class NewsController {
  // ===== PUBLIC METHODS =====

  // Get published news with pagination and filters
  async getPublishedNews(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      const filter: any = { status: "published" };

      // Filter by category
      if (req.query.category && req.query.category !== "all") {
        filter.category = req.query.category;
      }

      // Search by text
      if (req.query.search) {
        filter.$text = { $search: req.query.search as string };
      }

      // Filter by featured/hot status
      if (req.query.featured === "true") {
        filter.isFeatured = true;
      }
      if (req.query.hot === "true") {
        filter.isHot = true;
      }

      // Date range filter
      if (req.query.from || req.query.to) {
        filter.publishedAt = {};
        if (req.query.from) {
          filter.publishedAt.$gte = new Date(req.query.from as string);
        }
        if (req.query.to) {
          filter.publishedAt.$lte = new Date(req.query.to as string);
        }
      }

      const sortBy = req.query.sort || "publishedAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;
      const sortObj: any = { [sortBy as string]: sortOrder };

      // If sorting by relevance and there's a search query
      if (req.query.search && !req.query.sort) {
        sortObj.score = { $meta: "textScore" };
      }

      const [news, total] = await Promise.all([
        News.find(filter)
          .populate({
            path: "author",
            select: "_id username email avatar",
            options: { strictPopulate: false },
          })
          .select("-content") // Exclude full content for list view
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
        News.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching published news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get single news by slug
  async getNewsBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      const news = await News.findOne({
        slug,
        status: "published",
      }).populate({
        path: "author",
        select: "_id username email avatar",
        options: { strictPopulate: false },
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết",
        });
      }

      // Increment view count
      await News.findByIdAndUpdate(news._id, { $inc: { views: 1 } });

      // Get related news (same category, exclude current)
      const relatedNews = await News.find({
        category: news.category,
        status: "published",
        _id: { $ne: news._id },
      })
        .select("title slug featuredImage publishedAt views")
        .sort({ publishedAt: -1 })
        .limit(6);

      res.json({
        success: true,
        data: {
          news: {
            ...news.toObject(),
            views: news.views + 1, // Return updated view count
          },
          relatedNews,
        },
      });
    } catch (error) {
      console.error("Error fetching news by slug:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin bài viết",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get news categories with counts
  async getNewsCategories(req: Request, res: Response) {
    try {
      const categories = await News.aggregate([
        { $match: { status: "published" } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      const categoryData = [
        { id: "all", name: "Tất cả", slug: "tat-ca", count: 0 },
        { id: "mua-ban", name: "Mua bán", slug: "mua-ban", count: 0 },
        { id: "cho-thue", name: "Cho thuê", slug: "cho-thue", count: 0 },
        { id: "tai-chinh", name: "Tài chính", slug: "tai-chinh", count: 0 },
        { id: "phong-thuy", name: "Phong thủy", slug: "phong-thuy", count: 0 },
        { id: "chung", name: "Chung", slug: "chung", count: 0 },
      ];

      let totalCount = 0;
      categories.forEach((cat: { _id: string; count: number }) => {
        const categoryIndex = categoryData.findIndex((c) => c.id === cat._id);
        if (categoryIndex !== -1) {
          categoryData[categoryIndex].count = cat.count;
          totalCount += cat.count;
        }
      });

      categoryData[0].count = totalCount; // Set "Tất cả" count

      res.json({
        success: true,
        data: categoryData,
      });
    } catch (error) {
      console.error("Error fetching news categories:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh mục tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get featured news for homepage
  async getFeaturedNews(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6;

      const featuredNews = await News.find({
        status: "published",
        isFeatured: true,
      })
        .populate({
          path: "author",
          select: "_id username avatar",
          options: { strictPopulate: false },
        })
        .select("title slug featuredImage publishedAt category views readTime")
        .sort({ publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: featuredNews,
      });
    } catch (error) {
      console.error("Error fetching featured news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tin tức nổi bật",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get hot news
  async getHotNews(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const hotNews = await News.find({
        status: "published",
        isHot: true,
      })
        .select("title slug publishedAt views")
        .sort({ views: -1, publishedAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: hotNews,
      });
    } catch (error) {
      console.error("Error fetching hot news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy tin tức hot",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ===== ADMIN METHODS =====

  // Get all news for admin with filters
  async getAdminNews(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: any = {};

      // Filter by status
      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
      }

      // Filter by category
      if (req.query.category && req.query.category !== "all") {
        filter.category = req.query.category;
      }

      // Filter by author (only admin can see all, employee can see only their own)
      if (req.user?.role === "employee") {
        filter.author = req.user.id;
      } else if (req.query.author) {
        filter.author = req.query.author;
      }

      // Search by text
      if (req.query.search) {
        filter.$text = { $search: req.query.search as string };
      }

      const sortBy = req.query.sort || "createdAt";
      const sortOrder = req.query.order === "asc" ? 1 : -1;
      const sortObj: any = { [sortBy as string]: sortOrder };

      // Add filter to exclude news with invalid authors from the database query
      // This is better than filtering after population
      const validAuthorIds = await User.find({}).distinct("_id");
      filter.author = { $in: validAuthorIds };

      const [news, total] = await Promise.all([
        News.find(filter)
          .populate({
            path: "author",
            select: "_id username email avatar",
            options: { strictPopulate: false },
          })
          .sort(sortObj)
          .skip(skip)
          .limit(limit),
        News.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Create new news
  async createNews(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        title,
        content,
        featuredImage,
        category,
        status,
        isHot,
        isFeatured,
      } = req.body;

      // Validate required fields
      if (!title || !content || !category) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin bắt buộc",
        });
      }

      // Generate unique slug
      let slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Check if slug exists
      const existingNews = await News.findOne({ slug });
      if (existingNews) {
        slug = `${slug}-${Date.now()}`;
      }

      const newsData: Partial<INews> = {
        title,
        slug,
        content,
        featuredImage: featuredImage || "",
        category,
        author: new mongoose.Types.ObjectId(req.user!.id),
        status: status || "draft",
        isHot: isHot || false,
        isFeatured: isFeatured || false,
      };

      const news = new News(newsData);
      await news.save();

      // Populate author for response
      await news.populate({
        path: "author",
        select: "_id username email avatar",
        options: { strictPopulate: false },
      });

      res.status(201).json({
        success: true,
        message: "Tạo tin tức thành công",
        data: news,
      });
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get single news for editing
  async getNewsById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID không hợp lệ",
        });
      }

      const filter: any = { _id: id };

      // Employee can only see their own news
      if (req.user?.role === "employee") {
        filter.author = req.user.id;
      }

      const news = await News.findOne(filter).populate({
        path: "author",
        select: "_id username email avatar",
        options: { strictPopulate: false },
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin tức",
        });
      }

      res.json({
        success: true,
        data: news,
      });
    } catch (error) {
      console.error("Error fetching news by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update news
  async updateNews(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        title,
        content,
        featuredImage,
        category,
        status,
        isHot,
        isFeatured,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID không hợp lệ",
        });
      }

      const filter: any = { _id: id };

      // Employee can only update their own news
      if (req.user?.role === "employee") {
        filter.author = req.user.id;
      }

      const news = await News.findOne(filter);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin tức hoặc bạn không có quyền chỉnh sửa",
        });
      }

      // Update fields
      if (title) news.title = title;
      if (content) news.content = content;
      if (featuredImage !== undefined) news.featuredImage = featuredImage;
      if (category) news.category = category as any;
      if (status) news.status = status as any;
      if (isHot !== undefined) news.isHot = isHot;
      if (isFeatured !== undefined) news.isFeatured = isFeatured;

      // Regenerate slug if title changed
      if (title && title !== news.title) {
        let newSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();

        const existingNews = await News.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existingNews) {
          newSlug = `${newSlug}-${Date.now()}`;
        }
        news.slug = newSlug;
      }

      await news.save();
      await news.populate({
        path: "author",
        select: "_id username email avatar",
        options: { strictPopulate: false },
      });

      res.json({
        success: true,
        message: "Cập nhật tin tức thành công",
        data: news,
      });
    } catch (error) {
      console.error("Error updating news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Delete news
  async deleteNews(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID không hợp lệ",
        });
      }

      const filter: any = { _id: id };

      // Employee can only delete their own news
      if (req.user?.role === "employee") {
        filter.author = req.user.id;
      }

      const news = await News.findOneAndDelete(filter);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin tức hoặc bạn không có quyền xóa",
        });
      }

      res.json({
        success: true,
        message: "Xóa tin tức thành công",
      });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Update news status (admin only)
  async updateNewsStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền thay đổi trạng thái tin tức",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID không hợp lệ",
        });
      }

      if (!["draft", "pending", "published", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      const news = await News.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate({
        path: "author",
        select: "_id username email avatar",
        options: { strictPopulate: false },
      });

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin tức",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: news,
      });
    } catch (error) {
      console.error("Error updating news status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật trạng thái",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Get news statistics (admin only)
  async getNewsStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền xem thống kê",
        });
      }

      const [statusStats, categoryStats, totalViews, topViewedNews] =
        await Promise.all([
          News.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
          News.aggregate([
            { $match: { status: "published" } },
            { $group: { _id: "$category", count: { $sum: 1 } } },
          ]),
          News.aggregate([
            { $match: { status: "published" } },
            { $group: { _id: null, totalViews: { $sum: "$views" } } },
          ]),
          News.find({ status: "published" })
            .select("title slug views publishedAt")
            .sort({ views: -1 })
            .limit(10),
        ]);

      res.json({
        success: true,
        data: {
          statusStats,
          categoryStats,
          totalViews: totalViews[0]?.totalViews || 0,
          topViewedNews,
        },
      });
    } catch (error) {
      console.error("Error fetching news stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê tin tức",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
