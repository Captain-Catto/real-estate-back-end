import { Response } from "express";
import { Notification, INotification } from "../models/Notification";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { webSocketService } from "../services/WebSocketService";

/**
 * 🔔 SIMPLIFIED NOTIFICATION CONTROLLER
 * Chỉ giữ lại 4 loại thông báo cần thiết:
 * 1. 💰 PAYMENT - Nạp tiền thành công
 * 2. 💳 POST_PAYMENT - Thanh toán tin đăng
 * 3. ✅ POST_APPROVED - Tin đăng được duyệt
 * 4. ❌ POST_REJECTED - Tin đăng bị từ chối
 *
 * 🎯 Khi click vào notification sẽ chuyển hướng trực tiếp đến link liên quan
 */
export class NotificationController {
  // Lấy danh sách notification của user
  static async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const read = req.query.read as string;

      console.log("Query parameters:", { page, limit, type, read });
      console.log("User ID:", userId);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Build query - CHỈ CHO PHÉP 4 LOẠI THÔNG BÁO
      const query: any = { userId: new mongoose.Types.ObjectId(userId) };

      if (
        type &&
        ["PAYMENT", "POST_PAYMENT", "POST_APPROVED", "POST_REJECTED"].includes(
          type
        )
      ) {
        query.type = type;
      }

      if (read !== undefined) {
        query.read = read === "true";
      }

      const skip = (page - 1) * limit;

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false,
      });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
          unreadCount,
        },
      });
    } catch (error) {
      console.error("Error getting notifications:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Đánh dấu notification đã đọc
  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({
          success: false,
          message: "ID thông báo không hợp lệ",
        });
      }

      const notification = await Notification.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(notificationId),
          userId: new mongoose.Types.ObjectId(userId),
        },
        { read: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông báo",
        });
      }

      res.json({
        success: true,
        message: "Đã đánh dấu đã đọc",
        data: { notification },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đánh dấu đã đọc",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Đánh dấu tất cả notification đã đọc
  static async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = await Notification.updateMany(
        {
          userId: new mongoose.Types.ObjectId(userId),
          read: false,
        },
        { read: true }
      );

      res.json({
        success: true,
        message: `Đã đánh dấu ${result.modifiedCount} thông báo đã đọc`,
        data: { updatedCount: result.modifiedCount },
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đánh dấu tất cả đã đọc",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Xóa notification
  static async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const notificationId = req.params.id;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        return res.status(400).json({
          success: false,
          message: "ID thông báo không hợp lệ",
        });
      }

      const notification = await Notification.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông báo",
        });
      }

      res.json({
        success: true,
        message: "Đã xóa thông báo",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Tạo notification mới (dùng internal)
  static async createNotification(
    userId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: "PAYMENT" | "POST_PAYMENT" | "POST_APPROVED" | "POST_REJECTED" | "POST_EXPIRED" | "PACKAGE_PURCHASE" | "SYSTEM" | "INTEREST",
    data?: any
  ): Promise<INotification | null> {
    try {
      const notification = new Notification({
        userId: new mongoose.Types.ObjectId(userId),
        title,
        message,
        type,
        data: data || {},
      });

      await notification.save();
      
      // Emit WebSocket event for real-time notification updates
      webSocketService.emitNotificationUpdate({
        userId: userId.toString(),
        notification: {
          id: notification._id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: notification.read,
          createdAt: notification.createdAt,
          data: notification.data
        }
      });
      
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  // Lấy số lượng notification chưa đọc
  static async getUnreadCount(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const unreadCount = await Notification.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        read: false,
      });

      res.json({
        success: true,
        data: {
          unreadCount,
        },
      });
    } catch (error) {
      console.error("Error getting unread count:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy số thông báo chưa đọc",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // TEST ENDPOINT - Tạo notification test (chỉ dùng cho development)
  static async createTestNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Tạo notification test
      const notification = await NotificationController.createNotification(
        userId,
        "Test Notification",
        "This is a WebSocket test notification",
        "PAYMENT"
      );

      if (notification) {
        res.json({
          success: true,
          message: "Test notification created successfully",
          data: { notification }
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to create test notification"
        });
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo test notification",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ===== CHỈ GIỮ LẠI 4 HELPER METHODS CẦN THIẾT =====

  static async createPaymentNotification(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    paymentId?: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "💰 Nạp tiền thành công",
      `Bạn đã nạp thành công ${amount.toLocaleString(
        "vi-VN"
      )} VNĐ vào tài khoản`,
      "PAYMENT",
      { amount, paymentId }
    );
  }

  static async createPostPaymentNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    amount: number,
    postId: string,
    paymentId?: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "💳 Thanh toán tin đăng",
      `Bạn đã thanh toán ${amount.toLocaleString(
        "vi-VN"
      )} VNĐ cho tin đăng "${postTitle}"`,
      "POST_PAYMENT",
      { postId, postTitle, amount, paymentId }
    );
  }

  static async createPostApprovedNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "✅ Tin đăng được duyệt",
      `Tin đăng "${postTitle}" của bạn đã được duyệt và hiển thị công khai`,
      "POST_APPROVED",
      { postId, postTitle }
    );
  }

  static async createPostRejectedNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string,
    reason?: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "❌ Tin đăng bị từ chối",
      `Tin đăng "${postTitle}" của bạn đã bị từ chối${
        reason ? `: ${reason}` : ""
      }`,
      "POST_REJECTED",
      { postId, postTitle, reason }
    );
  }

  // ===== XÓA TẤT CẢ ADMIN METHODS =====
  // Không cần admin tạo thông báo thủ công nữa
  // Tất cả thông báo đều tự động từ hệ thống:
  // - PAYMENT: tự động từ PaymentController (nạp tiền)
  // - POST_PAYMENT: tự động từ PaymentController (thanh toán tin đăng)
  // - POST_APPROVED: tự động từ AdminController.approvePost
  // - POST_REJECTED: tự động từ AdminController.rejectPost
}
