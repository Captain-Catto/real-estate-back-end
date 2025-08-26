import { Response } from "express";
import { AuthenticatedRequest } from "../middleware";
import { PostExpiryService } from "../services/PostExpiryService";

export class PostExpiryController {
  /**
   * Admin endpoint để kiểm tra trạng thái scheduler
   * GET /api/admin/post-expiry/status
   */
  static async getSchedulerStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const postExpiryService = PostExpiryService.getInstance();
      const status = postExpiryService.getStatus();
      
      res.json({
        success: true,
        data: {
          scheduler: status,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting scheduler status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Admin endpoint để chạy thủ công việc kiểm tra expired posts
   * POST /api/admin/post-expiry/run-check
   */
  static async runManualCheck(req: AuthenticatedRequest, res: Response) {
    try {
      const postExpiryService = PostExpiryService.getInstance();
      const result = await postExpiryService.runManualCheck();
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            updatedCount: result.updatedCount,
            message: result.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message,
        });
      }
    } catch (error) {
      console.error("Error running manual expiry check:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Admin endpoint để lấy thống kê posts theo status
   * GET /api/admin/post-expiry/stats
   */
  static async getPostExpiryStats(req: AuthenticatedRequest, res: Response) {
    try {
      const { Post } = require("../models/Post");
      const now = new Date();

      // Đếm posts theo các trạng thái
      const stats = await Promise.all([
        Post.countDocuments({ status: "active" }),
        Post.countDocuments({ status: "expired" }),
        Post.countDocuments({ status: "pending" }),
        Post.countDocuments({ status: "inactive" }),
        Post.countDocuments({ status: "rejected" }),
        Post.countDocuments({ status: "deleted" }),
        // Posts active nhưng thực tế đã hết hạn (cần cập nhật)
        Post.countDocuments({
          status: "active",
          expiredAt: { $exists: true, $lt: now },
        }),
        // Posts active và còn hạn
        Post.countDocuments({
          status: "active",
          $or: [
            { expiredAt: { $exists: false } },
            { expiredAt: null },
            { expiredAt: { $gt: now } },
          ],
        }),
      ]);

      const [
        activeCount,
        expiredCount,
        pendingCount,
        inactiveCount,
        rejectedCount,
        deletedCount,
        needsUpdateCount,
        validActiveCount,
      ] = stats;

      res.json({
        success: true,
        data: {
          postStats: {
            active: activeCount,
            expired: expiredCount,
            pending: pendingCount,
            inactive: inactiveCount,
            rejected: rejectedCount,
            deleted: deletedCount,
            total: activeCount + expiredCount + pendingCount + inactiveCount + rejectedCount + deletedCount,
          },
          expiryStatus: {
            activeButExpired: needsUpdateCount, // Cần cập nhật
            validActive: validActiveCount,
            needsAttention: needsUpdateCount > 0,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error getting post expiry stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}