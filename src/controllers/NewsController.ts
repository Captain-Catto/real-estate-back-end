import { Request, Response } from "express";
import { News, INews } from "../models/News";
import { NewsCategory } from "../models/NewsCategory";
import mongoose from "mongoose";
import { NewsService } from "../services/NewsService";
import { TokenPayload } from "../utils/auth";

interface RequestWithUser extends Request {
  user?: TokenPayload;
}

export class NewsController {
  private newsService: NewsService;

  constructor() {
    this.newsService = new NewsService();
  }

  /**
   * Get published news with pagination and filters
   * GET /api/news?page=1&limit=12&category=mua-ban&search=keyword&featured=true&hot=true
   */
  async getPublishedNews(req: RequestWithUser, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;
      const category = req.query.category as string;
      const search = req.query.search as string;
      const featured = req.query.featured === "true";
      const hot = req.query.hot === "true";
      const sort = (req.query.sort as string) || "publishedAt";
      const order = (req.query.order as string) || "desc";

      // Build query
      const query: any = {
        status: "published",
        publishedAt: { $exists: true },
      };

      if (category && category !== "all") {
        query.category = category;
      }

      if (featured) {
        query.isFeatured = true;
      }

      if (hot) {
        query.isHot = true;
      }

      if (search) {
        query.$text = { $search: search };
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort] = order === "asc" ? 1 : -1;

      // Execute query with pagination
      const news = await News.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("author", "username email avatar")
        .lean();

      // Get total count for pagination
      const totalItems = await News.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getPublishedNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get news categories with counts
   * GET /api/news/categories
   */
  async getNewsCategories(req: RequestWithUser, res: Response) {
    try {
      // Get all active categories
      const categories = await NewsCategory.find({ isActive: true }).sort({
        order: 1,
      });

      // Get counts for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category: any) => {
          const count = await News.countDocuments({
            category: category.slug,
            status: "published",
          });
          return {
            id: category.slug,
            name: category.name,
            slug: category.slug,
            count,
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: categoriesWithCount,
      });
    } catch (error) {
      console.error("Error in getNewsCategories:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get featured news for homepage
   * GET /api/news/featured?limit=6
   */
  async getFeaturedNews(req: RequestWithUser, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 6;

      const news = await News.find({
        status: "published",
        isFeatured: true,
        publishedAt: { $exists: true },
      })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate("author", "username email avatar")
        .lean();

      return res.status(200).json({
        success: true,
        data: { news },
      });
    } catch (error) {
      console.error("Error in getFeaturedNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get hot news
   * GET /api/news/hot?limit=10
   */
  async getHotNews(req: RequestWithUser, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const news = await News.find({
        status: "published",
        isHot: true,
        publishedAt: { $exists: true },
      })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .populate("author", "username email avatar")
        .lean();

      return res.status(200).json({
        success: true,
        data: { news },
      });
    } catch (error) {
      console.error("Error in getHotNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get single news by slug
   * GET /api/news/slug/:slug
   */
  async getNewsBySlug(req: RequestWithUser, res: Response) {
    try {
      const { slug } = req.params;

      // Find news by slug
      const news = await News.findOne({
        slug,
        status: "published",
        publishedAt: { $exists: true },
      })
        .populate("author", "username email avatar")
        .lean();

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Increment views count
      await News.findByIdAndUpdate(news._id, { $inc: { views: 1 } });

      // Find related news (same category, excluding current news)
      const relatedNews = await News.find({
        _id: { $ne: news._id },
        category: news.category,
        status: "published",
        publishedAt: { $exists: true },
      })
        .sort({ publishedAt: -1 })
        .limit(6)
        .populate("author", "username email avatar")
        .lean();

      return res.status(200).json({
        success: true,
        data: { news, relatedNews },
      });
    } catch (error) {
      console.error("Error in getNewsBySlug:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get all news for admin (with filters)
   * GET /api/news/admin?page=1&limit=20&status=all&category=all&author=userId&search=keyword
   */
  async getAdminNews(req: RequestWithUser, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const status = req.query.status as string;
      const category = req.query.category as string;
      const author = req.query.author as string;
      const search = req.query.search as string;
      const sort = (req.query.sort as string) || "createdAt";
      const order = (req.query.order as string) || "desc";

      // Build query
      const query: any = {};

      if (status && status !== "all") {
        query.status = status;
      }

      if (category && category !== "all") {
        query.category = category;
      }

      if (author) {
        query.author = new mongoose.Types.ObjectId(author);
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { content: { $regex: search, $options: "i" } },
        ];
      }

      // Build sort object
      const sortObj: any = {};
      sortObj[sort] = order === "asc" ? 1 : -1;

      // Execute query with pagination
      const news = await News.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate("author", "username email avatar")
        .lean();

      // Get total count for pagination
      const totalItems = await News.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error in getAdminNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Create new news
   * POST /api/news/admin
   */
  async createNews(req: RequestWithUser, res: Response) {
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

      if (!title || !content || !category) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: title, content, and category are required",
        });
      }

      // Check if user exists in the request
      if (!req.user || !req.user.userId) {
        console.log("User object in request:", req.user);
        return res.status(401).json({
          success: false,
          message: "Authentication required. User information missing.",
        });
      }

      // Import NewsService directly to avoid 'this' context issues
      const NewsService = require("../services/NewsService").NewsService;
      const newsServiceInstance = new NewsService();

      // Generate slug from title
      const baseSlug = newsServiceInstance.generateSlug(title);

      // Luôn thêm timestamp vào slug để đảm bảo tính duy nhất và theo định dạng yêu cầu
      // Format: ten-bai-viet-timestamp
      const timestamp = Date.now().toString();
      const slug = `${baseSlug}-${timestamp}`;

      // Set publishedAt if status is published
      const publishedAt = status === "published" ? new Date() : undefined;

      // Ensure author ID is a valid MongoDB ObjectId
      const authorId = new mongoose.Types.ObjectId(req.user.userId);

      // Log the user information for debugging
      console.log("Creating news with user:", {
        userId: req.user.userId,
        role: req.user.role,
        username: req.user.username,
      });

      // Create new news article
      const newsData = {
        title,
        content,
        slug,
        featuredImage,
        category,
        author: authorId, // Use the explicit ObjectId from userId
        status: status || "draft",
        publishedAt,
        isHot: isHot || false,
        isFeatured: isFeatured || false,
      };

      const news = new News(newsData);
      await news.save();

      return res.status(201).json({
        success: true,
        message: "News created successfully",
        data: news,
      });
    } catch (error) {
      console.error("Error in createNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get single news for editing
   * GET /api/news/admin/:id
   */
  async getNewsById(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID format",
        });
      }

      const news = await News.findById(id)
        .populate("author", "username email avatar")
        .lean();

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Check if user is author or admin
      if (
        req.user?.role !== "admin" &&
        news.author._id.toString() !== req.user?.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this news article",
        });
      }

      return res.status(200).json({
        success: true,
        data: news,
      });
    } catch (error) {
      console.error("Error in getNewsById:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update news
   * PUT /api/news/admin/:id
   */
  async updateNews(req: RequestWithUser, res: Response) {
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
          message: "Invalid news ID format",
        });
      }

      // Find news article
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Check if user is author or admin
      if (
        req.user?.role !== "admin" &&
        req.user?.role !== "employee" &&
        news.author.toString() !== req.user?.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this news article",
        });
      }

      // Update fields if provided
      if (title !== undefined) news.title = title;
      if (content !== undefined) news.content = content;
      if (featuredImage !== undefined) news.featuredImage = featuredImage;
      if (category !== undefined) news.category = category;

      // Only admin can change hot/featured status
      if (req.user?.role === "admin") {
        if (isHot !== undefined) news.isHot = isHot;
        if (isFeatured !== undefined) news.isFeatured = isFeatured;
      }

      // Handle status changes based on user role
      if (status !== undefined && news.status !== status) {
        if (req.user?.role === "admin") {
          // Admin can make any status change
          if (status === "published" && !news.publishedAt) {
            // If publishing for the first time, set publishedAt
            news.publishedAt = new Date();
            news.moderatedBy = new mongoose.Types.ObjectId(req.user.userId);
          } else if (status === "unpublished" && news.status === "published") {
            // Unpublishing a published article - set unpublishedAt
            news.unpublishedAt = new Date();
            // Import NewsService directly to avoid 'this' context issues
            const NewsService = require("../services/NewsService").NewsService;
            const newsServiceInstance = new NewsService();
            // Schedule deletion after 30 days
            newsServiceInstance.scheduleDeleteUnpublished(news._id);
          }
          news.status = status;
        } else if (req.user?.role === "employee") {
          // Employee can only send for approval or save as draft
          if (status === "published") {
            news.status = "pending"; // Change to pending, not published
          } else if (status === "draft" || status === "pending") {
            news.status = status;
          }
          // Employees cannot unpublish news
        }
      }

      // If title changed, update slug with new title + timestamp format
      if (title && title !== news.title) {
        // Import NewsService directly to avoid 'this' context issues
        const NewsService = require("../services/NewsService").NewsService;
        const newsServiceInstance = new NewsService();

        const baseSlug = newsServiceInstance.generateSlug(title);

        // Luôn thêm timestamp vào slug để đảm bảo tính duy nhất và theo định dạng yêu cầu
        // Format: ten-bai-viet-timestamp
        const timestamp = Date.now().toString();
        news.slug = `${baseSlug}-${timestamp}`;
      }

      await news.save();

      return res.status(200).json({
        success: true,
        message:
          news.status === "pending"
            ? "News submitted for approval"
            : "News updated successfully",
        data: news,
      });
    } catch (error) {
      console.error("Error in updateNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Delete news
   * DELETE /api/news/admin/:id
   */
  async deleteNews(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID format",
        });
      }

      // Find news article
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Check if user is author or admin
      if (
        req.user?.role !== "admin" &&
        news.author.toString() !== req.user?.userId.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this news article",
        });
      }

      // Instead of deleting published news, mark as unpublished and schedule deletion
      if (news.status === "published" && req.user?.role === "admin") {
        news.status = "unpublished";
        news.unpublishedAt = new Date();
        news.unpublishReason = "Manually unpublished by administrator";
        await news.save();

        // Import NewsService directly to avoid 'this' context issues
        const NewsService = require("../services/NewsService").NewsService;
        const newsServiceInstance = new NewsService();

        // Schedule for deletion after 30 days
        await newsServiceInstance.scheduleDeleteUnpublished(news._id);

        return res.status(200).json({
          success: true,
          message: "News unpublished and scheduled for deletion in 30 days",
        });
      } else {
        // For drafts, pending or already unpublished news, delete immediately
        await News.findByIdAndDelete(id);

        return res.status(200).json({
          success: true,
          message: "News deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error in deleteNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Approve pending news (admin only)
   * PUT /api/news/admin/:id/approve
   */
  async approveNews(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can approve news",
        });
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID",
        });
      }

      // Find the news article
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      if (news.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending news can be approved",
        });
      }

      // Update news status and add publish metadata
      news.status = "published";
      news.publishedAt = new Date();
      news.moderatedBy = new mongoose.Types.ObjectId(req.user.userId);
      await news.save();

      // Import NewsService directly to avoid 'this' context issues
      const NewsService = require("../services/NewsService").NewsService;
      const newsServiceInstance = new NewsService();

      // Send notification about newly published article
      await newsServiceInstance.sendNewsNotification(news);

      return res.status(200).json({
        success: true,
        message: "News approved and published successfully",
        data: news,
      });
    } catch (error) {
      console.error("Error in approveNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Unpublish a published news (admin only)
   * PUT /api/news/admin/:id/unpublish
   */
  async unpublishNews(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can unpublish news",
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID",
        });
      }

      // Find the news article
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      if (news.status !== "published") {
        return res.status(400).json({
          success: false,
          message: "Only published news can be unpublished",
        });
      }

      // Update news status and set unpublish metadata
      news.status = "unpublished";
      news.unpublishedAt = new Date();
      news.unpublishReason = reason || "No reason provided";
      await news.save();

      // Import NewsService directly to avoid 'this' context issues
      const NewsService = require("../services/NewsService").NewsService;
      const newsServiceInstance = new NewsService();

      // Schedule for deletion after 30 days
      await newsServiceInstance.scheduleDeleteUnpublished(news._id);

      return res.status(200).json({
        success: true,
        message:
          "News unpublished successfully and scheduled for deletion in 30 days",
        data: news,
      });
    } catch (error) {
      console.error("Error in unpublishNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Reject a pending news article (admin only)
   * PUT /api/news/admin/:id/reject
   */
  async rejectNews(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can reject news",
        });
      }

      const { id } = req.params;
      const { reason } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID",
        });
      }

      // Import NewsService directly to avoid 'this' context issues
      const NewsService = require("../services/NewsService").NewsService;
      const newsServiceInstance = new NewsService();

      // Use the service to reject the news
      const news = await newsServiceInstance.rejectNews(
        id,
        req.user.userId,
        reason
      );

      return res.status(200).json({
        success: true,
        message: "News rejected successfully",
        data: news,
      });
    } catch (error) {
      console.error("Error in rejectNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Update news status (admin only)
   * PUT /api/news/admin/:id/status
   */
  async updateNewsStatus(req: RequestWithUser, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid news ID format",
        });
      }

      if (
        !["draft", "pending", "published", "unpublished", "rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      // Find news article
      const news = await News.findById(id);

      if (!news) {
        return res.status(404).json({
          success: false,
          message: "News article not found",
        });
      }

      // Update status and publishedAt if needed
      news.status = status;
      if (status === "published" && !news.publishedAt) {
        news.publishedAt = new Date();
      }

      await news.save();

      return res.status(200).json({
        success: true,
        message: "News status updated successfully",
        data: news,
      });
    } catch (error) {
      console.error("Error in updateNewsStatus:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get pending news for approval
   * GET /api/news/admin/pending?page=1&limit=10
   */
  async getPendingNews(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can view pending news",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      try {
        // Import NewsService directly to avoid 'this' context issues
        const NewsService = require("../services/NewsService").NewsService;
        const newsServiceInstance = new NewsService();

        const result = await newsServiceInstance.getPendingNews(page, limit);

        return res.status(200).json({
          success: true,
          data: result,
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: (error as Error).message,
        });
      }
    } catch (error) {
      console.error("Error in getPendingNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get news statistics (admin only)
   * GET /api/news/admin/stats
   */
  async getNewsStats(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can view news statistics",
        });
      }

      // Get status statistics
      const statusStats = await News.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      // Get category statistics
      const categoryStats = await News.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      // Get total views
      const viewsResult = await News.aggregate([
        { $group: { _id: null, totalViews: { $sum: "$views" } } },
      ]);
      const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

      // Get top viewed news
      const topViewedNews = await News.find({
        status: "published",
      })
        .sort({ views: -1 })
        .limit(10)
        .populate("author", "username email avatar")
        .lean();

      // Get pending news count
      const pendingCount = await News.countDocuments({ status: "pending" });

      // Get recently published news
      const recentlyPublished = await News.find({
        status: "published",
        publishedAt: { $exists: true },
      })
        .sort({ publishedAt: -1 })
        .limit(5)
        .populate("author", "username email avatar")
        .populate("moderatedBy", "username email")
        .lean();

      // Get soon to be deleted news (unpublished more than 25 days ago)
      const twentyFiveDaysAgo = new Date();
      twentyFiveDaysAgo.setDate(twentyFiveDaysAgo.getDate() - 25);

      const soonToBeDeleted = await News.find({
        status: "unpublished",
        unpublishedAt: { $lt: twentyFiveDaysAgo },
      })
        .sort({ unpublishedAt: 1 })
        .limit(5)
        .populate("author", "username email avatar")
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          statusStats,
          categoryStats,
          totalViews,
          topViewedNews,
          pendingCount,
          recentlyPublished,
          soonToBeDeleted,
        },
      });
    } catch (error) {
      console.error("Error in getNewsStats:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }

  /**
   * Clean up expired news (admin only, scheduled task)
   * POST /api/news/admin/cleanup
   */
  async cleanupExpiredNews(req: RequestWithUser, res: Response) {
    try {
      // Check if user is admin
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can perform cleanup",
        });
      }

      // Import NewsService directly to avoid 'this' context issues
      const NewsService = require("../services/NewsService").NewsService;
      const newsServiceInstance = new NewsService();

      await newsServiceInstance.deleteExpiredNews();

      return res.status(200).json({
        success: true,
        message: "Expired news cleanup completed",
      });
    } catch (error) {
      console.error("Error in cleanupExpiredNews:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: (error as Error).message,
      });
    }
  }
}
