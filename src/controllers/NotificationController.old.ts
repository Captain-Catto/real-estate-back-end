import { Response } from "express";
import { Notification, INotification } from "../models/Notification";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware";
import { NotificationService } from "../services/NotificationService";
import mongoose from "mongoose";

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

      // Build query
      const query: any = { userId: new mongoose.Types.ObjectId(userId) };

      if (type) {
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
      const { notificationId } = req.params;

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
        data: notification,
        message: "Đã đánh dấu thông báo đã đọc",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đánh dấu thông báo",
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
        data: {
          modifiedCount: result.modifiedCount,
        },
        message: `Đã đánh dấu ${result.modifiedCount} thông báo đã đọc`,
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi đánh dấu tất cả thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Xóa notification
  static async deleteNotification(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { notificationId } = req.params;

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
    type: INotification["type"],
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

  // Helper methods for creating specific notification types - CHỈ GIỮ LẠI 3 LOẠI CẦN THIẾT
  static async createPaymentNotification(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    paymentId?: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "Nạp tiền thành công",
      `Bạn đã nạp thành công ${amount.toLocaleString(
        "vi-VN"
      )} VNĐ vào tài khoản`,
      "PAYMENT",
      { amount, paymentId }
    );
  }

  static async createPostApprovedNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string
  ) {
    return await NotificationController.createNotification(
      userId,
      "Tin đăng được duyệt",
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
      "Tin đăng bị từ chối",
      `Tin đăng "${postTitle}" của bạn đã bị từ chối${
        reason ? `: ${reason}` : ""
      }`,
      "POST_REJECTED",
      { postId, postTitle, reason }
    );
  }

  // ❌ XÓA CÁC METHODS KHÔNG CẦN THIẾT:
  // - createPackagePurchaseNotification  
  // - createInterestNotification
  // - createDemoNotifications
  // - createSystemNotification (admin methods)
  // - getAdminNotifications  
  // - getNotificationHistory
  // - searchUsers

  // Demo notification với action buttons (chỉ dùng cho testing)
  static async createDemoNotifications(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const userId = req.user?.userId;

      console.log("Creating demo notifications for user:", userId);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Import NotificationService
      const { NotificationService } = await import(
        "../services/NotificationService"
      );

      // Tạo các notification demo
      const promises = [
        // 1. Top-up Success
        NotificationService.createTopUpSuccessNotification(
          userId,
          500000,
          `DEMO_ORDER_${Date.now()}_1`
        ),

        // 2. Package Purchase
        NotificationService.createPackagePurchaseNotification(
          userId,
          "Gói VIP 30 ngày",
          300000,
          `DEMO_ORDER_${Date.now()}_2`,
          30
        ),

        // 3. Post Approved
        NotificationService.createPostApprovedNotification(
          userId,
          "Bán căn hộ chung cư Vinhomes Central Park - View sông tuyệt đẹp",
          "demo_post_approved_id"
        ),

        // 4. Post Rejected
        NotificationService.createPostRejectedNotification(
          userId,
          "Cho thuê nhà nguyên căn Quận 1",
          "demo_post_rejected_id",
          "Thiếu thông tin giá cả và hình ảnh mô tả"
        ),

        // 5. Interest
        NotificationService.createInterestNotification(
          userId,
          "Bán biệt thự Thảo Điền - Khu compound cao cấp",
          "demo_post_interest_id",
          "Nguyễn Văn Demo"
        ),

        // 6. System
        NotificationService.createSystemNotification(
          userId,
          "🎉 Cập nhật tính năng mới",
          "Hệ thống vừa được cập nhật với nhiều tính năng mới! Hãy khám phá ngay để có trải nghiệm tốt nhất.",
          {
            actionButton: {
              text: "Khám phá ngay",
              link: "/nguoi-dung/dashboard",
              style: "primary",
            },
          }
        ),
      ];

      await Promise.all(promises);

      console.log("Demo notifications created successfully");

      res.json({
        success: true,
        message: "Đã tạo 6 demo notifications với action buttons",
        data: {
          created: 6,
          types: [
            {
              type: "PAYMENT",
              title: "Nạp tiền thành công",
              actionButton: "Xem ví",
            },
            {
              type: "PACKAGE_PURCHASE",
              title: "Mua gói tin thành công",
              actionButton: "Đăng tin ngay",
            },
            {
              type: "POST_APPROVED",
              title: "Tin đăng được duyệt",
              actionButton: "Xem tin đăng",
            },
            {
              type: "POST_REJECTED",
              title: "Tin đăng bị từ chối",
              actionButton: "Chỉnh sửa tin",
            },
            {
              type: "INTEREST",
              title: "Có người quan tâm",
              actionButton: "Xem tin đăng",
            },
            {
              type: "SYSTEM",
              title: "Thông báo hệ thống",
              actionButton: "Khám phá ngay",
            },
          ],
        },
      });

      console.log("Demo notifications created successfully");
    } catch (error) {
      console.error("Error creating demo notifications:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi tạo demo notifications",
      });
    }
  }

  // ADMIN METHODS

  // ADMIN: Tạo thông báo hệ thống
  static async createSystemNotification(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const {
        title,
        message,
        targetType,
        targetUsers,
        userRole,
        actionButton,
      } = req.body;

      console.log("Creating system notification:", {
        title,
        message,
        targetType,
      });

      // Validate required fields
      if (!title || !message || !targetType) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc (title, message, targetType)",
        });
      }

      let userIds: string[] = [];

      // Determine target users based on targetType
      if (targetType === "all") {
        // Send to all users (excluding admins)
        const allUsers = await User.find({
          role: { $in: ["user", "vip"] },
        }).select("_id");
        userIds = allUsers.map((user) => user._id.toString());
        console.log(`Found ${userIds.length} users for 'all' target type`);
      } else if (targetType === "specific") {
        // Send to specific users
        if (
          !targetUsers ||
          !Array.isArray(targetUsers) ||
          targetUsers.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Cần chỉ định danh sách người dùng khi targetType là 'specific'",
          });
        }
        userIds = targetUsers;
        console.log(`Using ${userIds.length} specific users`);
      } else if (targetType === "role") {
        // Send to users with specific role
        if (!userRole) {
          return res.status(400).json({
            success: false,
            message: "Cần chỉ định role khi targetType là 'role'",
          });
        }
        const roleUsers = await User.find({ role: userRole }).select("_id");
        userIds = roleUsers.map((user) => user._id.toString());
        console.log(`Found ${userIds.length} users with role '${userRole}'`);
      } else {
        return res.status(400).json({
          success: false,
          message:
            "targetType không hợp lệ. Chỉ chấp nhận 'all', 'specific', 'role'",
        });
      }

      if (userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Không tìm thấy người dùng nào phù hợp",
        });
      }

      // Create notifications for all target users
      const notificationPromises = userIds.map((userId) =>
        NotificationService.createSystemNotification(userId, title, message, {
          actionButton,
        })
      );

      await Promise.all(notificationPromises);

      console.log(`System notification sent to ${userIds.length} users`);

      res.json({
        success: true,
        message: `Đã gửi thông báo tới ${userIds.length} người dùng`,
        data: {
          targetCount: userIds.length,
          targetType,
          title,
          message,
        },
      });
    } catch (error) {
      console.error("Error creating system notification:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo thông báo hệ thống",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ADMIN: Xem tất cả thông báo của người dùng
  static async getAdminNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      const { page = 1, limit = 10, userId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build query
      const query: any = {};
      if (userId) {
        query.userId = new mongoose.Types.ObjectId(userId as string);
      }

      // Get notifications with user info
      const notifications = await Notification.find(query)
        .populate({
          path: "userId",
          select: "username email",
          model: "User",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      // Transform to match frontend interface
      const transformedNotifications = notifications.map(
        (notification: any) => ({
          _id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: notification.data,
          read: notification.read,
          createdAt: notification.createdAt,
          user: {
            _id: notification.userId._id,
            username: notification.userId.username || "Unknown",
            email: notification.userId.email || "Unknown",
          },
        })
      );

      const total = await Notification.countDocuments(query);

      res.json({
        success: true,
        data: {
          notifications: transformedNotifications,
          pagination: {
            current: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            total,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ADMIN: Lấy lịch sử thông báo đã gửi
  static async getNotificationHistory(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Get system notifications grouped by creation batch
      const notifications = await Notification.aggregate([
        {
          $match: {
            type: "SYSTEM",
          },
        },
        {
          $group: {
            _id: {
              title: "$title",
              message: "$message",
              createdAt: {
                $dateToString: {
                  format: "%Y-%m-%d %H:%M",
                  date: "$createdAt",
                },
              },
            },
            title: { $first: "$title" },
            message: { $first: "$message" },
            data: { $first: "$data" },
            createdAt: { $first: "$createdAt" },
            totalRecipients: { $sum: 1 },
            readCount: {
              $sum: {
                $cond: ["$read", 1, 0],
              },
            },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: Number(limit),
        },
      ]);

      // Get total count for pagination
      const totalCount = await Notification.aggregate([
        {
          $match: {
            type: "SYSTEM",
          },
        },
        {
          $group: {
            _id: {
              title: "$title",
              message: "$message",
              createdAt: {
                $dateToString: {
                  format: "%Y-%m-%d %H:%M",
                  date: "$createdAt",
                },
              },
            },
          },
        },
        {
          $count: "total",
        },
      ]);

      const total = totalCount[0]?.total || 0;

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            current: Number(page),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching notification history:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải lịch sử thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // ADMIN: Tìm kiếm người dùng
  static async searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const { search = "", page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      // Build search query
      const searchQuery: any = { role: { $in: ["user", "vip"] } };
      if (search) {
        searchQuery.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const users = await User.find(searchQuery)
        .select("_id username email createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await User.countDocuments(searchQuery);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: Number(page),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tìm kiếm người dùng",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy thống kê thông báo (Admin only)
  static async getNotificationStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền xem thống kê",
        });
      }

      const stats = await Notification.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            unreadCount: {
              $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] },
            },
            readCount: {
              $sum: { $cond: [{ $eq: ["$read", true] }, 1, 0] },
            },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const totalNotifications = await Notification.countDocuments();
      const totalUsers = await User.countDocuments({
        role: { $in: ["user", "vip"] },
      });

      res.json({
        success: true,
        data: {
          stats,
          totalNotifications,
          totalUsers,
        },
      });
    } catch (error) {
      console.error("Error getting notification stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thống kê thông báo",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
