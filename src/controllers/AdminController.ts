import { Request, Response } from "express";
import { Post, IPost } from "../models/Post";
import { User, IUser } from "../models/User";
import { Payment, IPayment } from "../models/Payment";
import { Category } from "../models/Category";
import UserLog from "../models/UserLog";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middleware";
import { NotificationService } from "../services/NotificationService";
import { Package } from "../models/Package";

interface AdminStats {
  totalPosts: number;
  totalUsers: number;
  newUsersThisMonth: number;
  postsThisMonth: number;
  postsLastMonth: number;
  monthlyRevenue: number;
  pendingPosts: number;
  todayPostViews: number;
  approvedPosts: number;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: Date;
  status: string;
  relatedId: mongoose.Types.ObjectId;
}

export const AdminController = {
  // GET /api/admin/stats
  getAdminStats: async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

      // Total posts
      const totalPosts = await Post.countDocuments();

      // Total users
      const totalUsers = await User.countDocuments();

      // New users this month
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      // Posts this month
      const postsThisMonth = await Post.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      // Posts last month
      const postsLastMonth = await Post.countDocuments({
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth,
        },
      });

      // Monthly revenue (total payments this month)
      const monthlyPayments = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
          },
        },
      ]);
      const monthlyRevenue =
        monthlyPayments.length > 0 ? monthlyPayments[0].totalAmount : 0;

      // Pending posts
      const pendingPosts = await Post.countDocuments({
        status: "pending",
      });

      // Today's post views (sum of all views for posts updated today)
      const todayPostViewsResult = await Post.aggregate([
        {
          $match: {
            updatedAt: { $gte: startOfToday },
          },
        },
        {
          $group: {
            _id: null,
            totalViews: { $sum: "$views" },
          },
        },
      ]);
      const todayPostViews =
        todayPostViewsResult.length > 0
          ? todayPostViewsResult[0].totalViews
          : 0;

      // Approved posts
      const approvedPosts = await Post.countDocuments({
        status: "approved",
      });

      const stats: AdminStats = {
        totalPosts,
        totalUsers,
        newUsersThisMonth,
        postsThisMonth,
        postsLastMonth,
        monthlyRevenue,
        pendingPosts,
        todayPostViews,
        approvedPosts,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê admin",
      });
    }
  },

  // GET /api/admin/recent-activities
  getRecentActivities: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      // Get recent posts (last 24 hours)
      const recentPosts = await Post.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .populate("author", "username email")
        .sort({ createdAt: -1 })
        .limit(limit);

      // Get recent users (last 24 hours)
      const recentUsers = await User.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      // Get recent payments (last 24 hours)
      const recentPayments = await Payment.find({
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      })
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .limit(limit);

      // Combine and format activities
      const activities: ActivityItem[] = [];

      // Add post activities
      recentPosts.forEach((post) => {
        const populatedPost = post as any; // Type assertion for populated fields
        activities.push({
          id: `post_${post._id}`,
          type: "post_submitted",
          message: `${
            populatedPost.author?.username || "User"
          } đã gửi tin đăng mới: ${post.title}`,
          time: post.createdAt,
          status: post.status as string,
          relatedId: post._id,
        });
      });

      // Add user activities
      recentUsers.forEach((user) => {
        activities.push({
          id: `user_${user._id}`,
          type: "user_registered",
          message: `Người dùng mới: ${user.username}`,
          time: user.createdAt,
          status: "success",
          relatedId: user._id,
        });
      });

      // Add payment activities
      recentPayments.forEach((payment) => {
        const populatedPayment = payment as any; // Type assertion for populated fields
        activities.push({
          id: `payment_${payment._id}`,
          type: "payment_received",
          message: `Thanh toán ${payment.amount.toLocaleString()} VNĐ từ ${
            populatedPayment.userId?.username || "User"
          }`,
          time: payment.createdAt,
          status: payment.status,
          relatedId: payment._id,
        });
      });

      // Sort by time and limit
      activities.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      );
      const limitedActivities = activities.slice(0, limit);

      res.json({
        success: true,
        data: limitedActivities,
      });
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy hoạt động gần đây",
      });
    }
  },

  // GET /api/admin/top-posts
  getTopPosts: async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      const topPosts = await Post.find()
        .populate("author", "username email")
        .sort({ views: -1 })
        .limit(limit)
        .select("title views status author createdAt");

      const formattedPosts = topPosts.map((post) => {
        const populatedPost = post as any; // Type assertion for populated fields
        return {
          id: post._id,
          title: post.title,
          views: post.views || 0,
          status: post.status,
          author: populatedPost.author?.username || "Unknown",
          createdAt: post.createdAt,
        };
      });

      res.json({
        success: true,
        data: formattedPosts,
      });
    } catch (error) {
      console.error("Error fetching top posts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy bài đăng phổ biến",
      });
    }
  },

  // GET /api/admin/users - Get all users with filters
  getUsers: async (req: Request, res: Response) => {
    try {
      const {
        search = "",
        role = "",
        status = "",
        page = 1,
        limit = 20,
      } = req.query;

      const query: any = {};

      // Apply search filter
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
        ];
      }

      // Apply role filter
      if (role && role !== "all") {
        query.role = role;
      }

      // Apply status filter (you'll need to add status field to User model)
      if (status && status !== "all") {
        query.status = status;
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Get users with pagination
      const users = await User.find(query)
        .select("-password -refreshTokens")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalUsers = await User.countDocuments(query);

      // Get additional stats for each user (posts, transactions, spending)
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const totalPosts = await Post.countDocuments({ author: user._id });
          const totalTransactions = await Payment.countDocuments({
            userId: user._id,
          });

          const spentResult = await Payment.aggregate([
            { $match: { userId: user._id, status: "completed" } },
            { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
          ]);
          const totalSpent =
            spentResult.length > 0 ? spentResult[0].totalSpent : 0;

          return {
            ...user.toObject(),
            totalPosts,
            totalTransactions,
            totalSpent,
          };
        })
      );

      res.json({
        success: true,
        data: {
          users: usersWithStats,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalUsers / limitNum),
            totalItems: totalUsers,
            itemsPerPage: limitNum,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách người dùng",
      });
    }
  },

  // GET /api/admin/user-stats - Get user statistics
  getUserStats: async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ status: "active" });
      const verifiedUsers = await User.countDocuments({ emailVerified: true });
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: startOfMonth },
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          verifiedUsers,
          newUsersThisMonth,
        },
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê người dùng",
      });
    }
  },

  // GET /api/admin/users/:id - Get user by ID
  getUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password -refreshTokens");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Get additional stats
      const totalPosts = await Post.countDocuments({ author: user._id });
      const totalTransactions = await Payment.countDocuments({
        userId: user._id,
      });

      const spentResult = await Payment.aggregate([
        { $match: { userId: user._id, status: "completed" } },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);
      const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;

      res.json({
        success: true,
        data: {
          user: {
            ...user.toObject(),
            totalPosts,
            totalTransactions,
            totalSpent,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin người dùng",
      });
    }
  },

  // PATCH /api/admin/users/:id/status - Update user status
  updateUserStatus: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const currentUserId = req.user?.userId;

      console.log("=== UPDATE USER STATUS ===");
      console.log("User ID from params:", id);
      console.log("Status from body:", status);
      console.log("Current user ID:", currentUserId);
      console.log("req.params:", req.params);
      console.log("req.body:", req.body);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "ID người dùng không được cung cấp",
        });
      }

      if (!["active", "inactive", "banned"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Don't allow changing admin status
      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Không thể thay đổi trạng thái của quản trị viên",
        });
      }

      // Save old status for logging
      const oldStatus = user.status;

      user.status = status;
      await user.save();

      // Create log entry
      if (currentUserId) {
        // Get client IP and User Agent
        const clientIP =
          req.ip ||
          req.connection.remoteAddress ||
          req.headers["x-forwarded-for"] ||
          "Unknown";
        const userAgent = req.headers["user-agent"] || "Unknown";

        await UserLog.create({
          userId: user._id,
          changedBy: currentUserId,
          action: "statusChanged",
          changes: {
            status: {
              from: oldStatus,
              to: status,
            },
          },
          details: `Trạng thái người dùng đã được thay đổi từ ${oldStatus} thành ${status}`,
          ipAddress: clientIP,
          userAgent: userAgent,
        });
      }

      res.json({
        success: true,
        message: "Cập nhật trạng thái người dùng thành công",
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái người dùng",
      });
    }
  },

  // DELETE /api/admin/users/:id - Delete user
  deleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Don't allow deleting admin users
      if (user.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Không thể xóa tài khoản quản trị viên",
        });
      }

      // Delete user's posts first
      await Post.deleteMany({ author: user._id });

      // Delete user
      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa người dùng thành công",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa người dùng",
      });
    }
  },

  // PUT /api/admin/users/:id - Update user
  updateUser: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { username, email, phoneNumber, role, status } = req.body;
      const currentUserId = req.user?.userId;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Check if email/username already exists
      if (email && email !== user.email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: id } });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: "Email đã tồn tại",
          });
        }
      }

      if (username && username !== user.username) {
        const existingUsername = await User.findOne({
          username,
          _id: { $ne: id },
        });
        if (existingUsername) {
          return res.status(400).json({
            success: false,
            message: "Tên người dùng đã tồn tại",
          });
        }
      }

      // Store old values for logging
      const oldValues = {
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
      };

      // Update user
      const updateData: any = {};
      if (username) updateData.username = username;
      if (email) updateData.email = email;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
      if (role && user.role !== "admin") updateData.role = role; // Don't allow changing admin role
      if (status) updateData.status = status;

      const updatedUser = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      }).select("-password -refreshTokens");

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng sau khi cập nhật",
        });
      }

      // Get additional stats for complete user data (same as getUserById)
      const totalPosts = await Post.countDocuments({ author: updatedUser._id });
      const totalTransactions = await Payment.countDocuments({
        userId: updatedUser._id,
      });

      const spentResult = await Payment.aggregate([
        { $match: { userId: updatedUser._id, status: "completed" } },
        { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
      ]);
      const totalSpent = spentResult.length > 0 ? spentResult[0].totalSpent : 0;

      // Create complete user object with computed fields
      const completeUser = {
        ...updatedUser.toObject(),
        totalPosts,
        totalTransactions,
        totalSpent,
      };

      // Create log entry for changes
      if (currentUserId) {
        const changes: Record<string, { from: any; to: any }> = {};

        if (username && username !== oldValues.username) {
          changes.username = { from: oldValues.username, to: username };
        }
        if (email && email !== oldValues.email) {
          changes.email = { from: oldValues.email, to: email };
        }
        if (
          phoneNumber !== undefined &&
          phoneNumber !== oldValues.phoneNumber
        ) {
          changes.phoneNumber = {
            from: oldValues.phoneNumber,
            to: phoneNumber,
          };
        }
        if (role && role !== oldValues.role && user.role !== "admin") {
          changes.role = { from: oldValues.role, to: role };
        }
        if (status && status !== oldValues.status) {
          changes.status = { from: oldValues.status, to: status };
        }

        if (Object.keys(changes).length > 0) {
          // Get client IP and User Agent
          const clientIP =
            req.ip ||
            req.connection.remoteAddress ||
            req.headers["x-forwarded-for"] ||
            "Unknown";
          const userAgent = req.headers["user-agent"] || "Unknown";

          await UserLog.create({
            userId: user._id,
            changedBy: currentUserId,
            action: "updated",
            changes,
            details: `Thông tin người dùng đã được cập nhật: ${Object.keys(
              changes
            ).join(", ")}`,
            ipAddress: clientIP,
            userAgent: userAgent,
          });
        }
      }

      res.json({
        success: true,
        message: "Cập nhật thông tin người dùng thành công",
        data: { user: completeUser },
      });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thông tin người dùng",
      });
    }
  },

  // GET /api/admin/users/:id/posts - Get user's posts
  getUserPosts: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const type = req.query.type as string;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Build query
      const query: any = { author: id };
      if (status && status !== "all") {
        query.status = status;
      }
      if (type && type !== "all") {
        query.type = type;
      }

      const skip = (page - 1) * limit;

      // Get posts with pagination
      const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username email")
        .select(
          "title type category location price area status views createdAt updatedAt images"
        );

      const total = await Post.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách tin đăng",
      });
    }
  },

  // GET /api/admin/users/:id/payments - Get user's payments
  getUserPayments: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Build query
      const query: any = { userId: id };
      if (status && status !== "all") {
        query.status = status;
      }

      const skip = (page - 1) * limit;

      // Get payments with pagination
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postId", "title type")
        .select(
          "orderId amount currency paymentMethod status description createdAt completedAt postId"
        );

      const total = await Payment.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử giao dịch",
      });
    }
  },

  // GET /api/admin/users/:id/logs - Get user logs
  getUserLogs: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      const skip = (page - 1) * limit;

      // Get logs with pagination
      const logs = await UserLog.find({ userId: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("changedBy", "username email role")
        .populate("userId", "username email");

      const total = await UserLog.countDocuments({ userId: id });
      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching user logs:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử thay đổi",
      });
    }
  },

  // GET /api/admin/posts - Get all posts for admin with filters
  getAdminPosts: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const {
        status,
        type,
        category,
        package: packageFilter,
        search,
        dateFrom,
        dateTo,
        author,
        project,
        searchMode,
      } = req.query;

      // Build filter object
      const filter: any = {};

      if (status && status !== "all") filter.status = status;
      if (type && type !== "all") filter.type = type;

      // Handle category filter
      if (category && category !== "all") {
        console.log(`🔍 Admin filtering by category: "${category}"`);

        // Since category field in posts is now stored as ObjectId, we need to use ObjectId for filtering
        if (mongoose.Types.ObjectId.isValid(category as string)) {
          // If frontend sends ObjectId, use it as ObjectId for comparison
          filter.category = new mongoose.Types.ObjectId(category as string);
          console.log(`✅ Using ObjectId: ${category}`);
        } else {
          // If frontend sends category id (like "cat_apartment"), find the ObjectId
          const categoryDoc = await Category.findOne({ id: category });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
            console.log(
              `✅ Found category by id: ${category} -> ${categoryDoc._id}`
            );
          } else {
            // If not found by id, try finding by name as fallback
            const categoryDocByName = await Category.findOne({
              name: category,
            });
            if (categoryDocByName) {
              filter.category = categoryDocByName._id;
              console.log(
                `✅ Found category by name: ${category} -> ${categoryDocByName._id}`
              );
            } else {
              console.log(`❌ Category "${category}" not found in database`);
              // Don't return error, just skip this filter to show all posts
            }
          }
        }
      }

      if (packageFilter && packageFilter !== "all")
        filter.package = packageFilter;
      if (author && mongoose.Types.ObjectId.isValid(author as string)) {
        filter.author = author;
      }

      // Add text search if provided
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      // Add date range filter
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) {
          filter.createdAt.$gte = new Date(dateFrom as string);
        }
        if (dateTo) {
          filter.createdAt.$lte = new Date(dateTo as string);
        }
      }

      // Handle project filter
      if (project && project !== "all") {
        console.log(`🔍 Admin filtering by project: "${project}"`);
        if (mongoose.Types.ObjectId.isValid(project as string)) {
          filter.project = new mongoose.Types.ObjectId(project as string);
          console.log(`✅ Using project ObjectId: ${project}`);
        } else {
          console.log(`❌ Invalid project ID: ${project}`);
        }
      }

      // Handle search mode (this affects how category filtering works)
      // searchMode can be "property" or "project"
      // This is mainly handled on frontend for UI logic, but we log it for debugging
      if (searchMode) {
        console.log(`🔍 Admin search mode: "${searchMode}"`);
      }

      console.log(`📋 Admin posts filter:`, JSON.stringify(filter, null, 2));

      const posts = await Post.find(filter)
        .populate("author", "username email avatar")
        .populate("category", "name slug id isProject")
        .populate("project", "name address category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPosts = await Post.countDocuments(filter);
      console.log(`📊 Found ${totalPosts} posts matching filter`);

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
      console.error("Error fetching admin posts:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách tin đăng",
      });
    }
  },

  // GET /api/admin/posts/stats - Get posts statistics
  getAdminPostsStats: async (req: Request, res: Response) => {
    try {
      // Get total counts for each status
      const total = await Post.countDocuments();
      const active = await Post.countDocuments({ status: "active" });
      const pending = await Post.countDocuments({ status: "pending" });
      const rejected = await Post.countDocuments({ status: "rejected" });
      const expired = await Post.countDocuments({ status: "expired" });
      const deleted = await Post.countDocuments({ status: "deleted" });

      // Get counts for each package/priority
      const vip = await Post.countDocuments({
        $or: [{ package: "vip" }, { priority: "vip" }],
      });
      const premium = await Post.countDocuments({
        $or: [{ package: "premium" }, { priority: "premium" }],
      });
      const normal = await Post.countDocuments({
        $and: [
          { package: { $nin: ["vip", "premium"] } },
          { priority: { $nin: ["vip", "premium"] } },
        ],
      });

      const stats = {
        total,
        active,
        pending,
        rejected,
        expired,
        deleted, // Add deleted count to stats
        vip,
        premium,
        normal,
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching admin posts stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê tin đăng",
      });
    }
  },

  // PUT /api/admin/posts/:id/approve - Approve post
  approvePost: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin đăng",
        });
      }

      post.status = "active";
      post.approvedAt = new Date();
      post.approvedBy = currentUserId
        ? new mongoose.Types.ObjectId(currentUserId)
        : undefined;

      // Tính toán expiredAt khi approve post (nếu có packageId và chưa có expiredAt)
      if (post.packageId && !post.expiredAt) {
        const packageInfo = await Package.findOne({
          id: post.packageId,
          isActive: true,
        });

        if (packageInfo) {
          const durationToUse = Number(
            post.originalPackageDuration || packageInfo.duration || 30
          );
          const now = new Date();
          post.expiredAt = new Date(
            now.getTime() + durationToUse * 24 * 60 * 60 * 1000
          );

          console.log(
            `📅 Post approved with expiry: Package ${post.packageId}, Duration: ${durationToUse} days, Expires at: ${post.expiredAt}`
          );
        }
      }

      await post.save();

      // Send notification for post approval
      try {
        await NotificationService.createPostApprovedNotification(
          post.author.toString(),
          post.title.toString(),
          post._id.toString()
        );
      } catch (error) {
        console.error("Error sending post approval notification:", error);
        // Don't fail the transaction for notification error
      }

      res.json({
        success: true,
        message: "Đã duyệt tin đăng thành công",
        data: { post },
      });
    } catch (error) {
      console.error("Error approving post:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi duyệt tin đăng",
      });
    }
  },

  // PUT /api/admin/posts/:id/reject - Reject post
  rejectPost: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const currentUserId = req.user?.userId;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp lý do từ chối",
        });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin đăng",
        });
      }

      post.status = "rejected";
      post.rejectedAt = new Date();
      post.rejectedBy = currentUserId
        ? new mongoose.Types.ObjectId(currentUserId)
        : undefined;
      post.rejectedReason = reason;
      await post.save();

      // Send notification for post rejection
      try {
        await NotificationService.createPostRejectedNotification(
          post.author.toString(),
          post.title.toString(),
          post._id.toString(),
          reason
        );
      } catch (error) {
        console.error("Error sending post rejection notification:", error);
        // Don't fail the transaction for notification error
      }

      res.json({
        success: true,
        message: "Đã từ chối tin đăng",
        data: { post },
      });
    } catch (error) {
      console.error("Error rejecting post:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi từ chối tin đăng",
      });
    }
  },

  // DELETE /api/admin/posts/:id - Delete post
  deleteAdminPost: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin đăng",
        });
      }

      await Post.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Đã xóa tin đăng thành công",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa tin đăng",
      });
    }
  },

  // GET /api/admin/posts/:id - Get single post by ID for admin
  getAdminPostById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID tin đăng không hợp lệ",
        });
      }

      const post = await Post.findById(id).populate(
        "author",
        "username email avatar phoneNumber"
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin đăng",
        });
      }

      res.json({
        success: true,
        data: { post },
      });
    } catch (error) {
      console.error("Error fetching admin post by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy chi tiết tin đăng",
      });
    }
  },

  // PUT /api/admin/posts/:id - Update post by admin (admin can edit all fields, employee can only change status)
  updateAdminPost: async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.userId;
      const userRole = req.user?.role;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "ID tin đăng không hợp lệ",
        });
      }

      // Check if user has permission (admin or employee)
      if (userRole !== "admin" && userRole !== "employee") {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      const post = await Post.findById(id);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin đăng",
        });
      }

      const updates = req.body;
      console.log("🔄 ADMIN POST UPDATE REQUEST");
      console.log("👤 User ID:", currentUserId);
      console.log("🎭 User Role:", userRole);
      console.log("📄 Post ID:", id);
      console.log("📦 Request body:", JSON.stringify(updates, null, 2));

      // If employee, only allow status changes
      if (userRole === "employee") {
        const allowedFields = ["status"];
        const requestedFields = Object.keys(updates);
        const invalidFields = requestedFields.filter(
          (field) => !allowedFields.includes(field)
        );

        if (invalidFields.length > 0) {
          return res.status(403).json({
            success: false,
            message: `Employee chỉ có thể thay đổi trạng thái tin đăng. Các trường không được phép: ${invalidFields.join(
              ", "
            )}`,
          });
        }

        // Handle status change
        if (updates.status) {
          const oldStatus = post.status;
          post.status = updates.status;

          // Add admin/employee info for status changes
          if (updates.status === "active") {
            post.approvedAt = new Date();
            post.approvedBy = new mongoose.Types.ObjectId(currentUserId);
            post.rejectedAt = undefined;
            post.rejectedBy = undefined;
            post.rejectedReason = undefined;
          } else if (updates.status === "rejected") {
            post.rejectedAt = new Date();
            post.rejectedBy = new mongoose.Types.ObjectId(currentUserId);
            post.rejectedReason = updates.reason || "Không đạt yêu cầu";
            post.approvedAt = undefined;
            post.approvedBy = undefined;
          } else if (updates.status === "pending") {
            // When restoring from deleted or changing to pending, clear approval/rejection info
            post.approvedAt = undefined;
            post.approvedBy = undefined;
            post.rejectedAt = undefined;
            post.rejectedBy = undefined;
            post.rejectedReason = undefined;
            console.log(
              `📋 Post ${id} status changed to pending by employee - cleared approval/rejection data`
            );
          }

          await post.save();

          // Send notifications for status changes
          try {
            if (updates.status === "active" && oldStatus !== "active") {
              await NotificationService.createPostApprovedNotification(
                post.author.toString(),
                post.title.toString(),
                post._id.toString()
              );
            } else if (
              updates.status === "rejected" &&
              oldStatus !== "rejected"
            ) {
              await NotificationService.createPostRejectedNotification(
                post.author.toString(),
                post.title.toString(),
                post._id.toString(),
                post.rejectedReason?.toString()
              );
            } else if (
              updates.status === "pending" &&
              oldStatus === "deleted"
            ) {
              // Notification for restore from deleted to pending by employee
              console.log(
                `📨 Post ${id} restored from deleted to pending by employee - notification could be sent here`
              );
            }
          } catch (error) {
            console.error("❌ Error sending notification:", error);
            // Don't fail the request for notification error
          }

          console.log(
            `✅ Post ${id} status updated from "${oldStatus}" to "${updates.status}" by employee ${currentUserId}`
          );
        }
      } else if (userRole === "admin") {
        // Admin can edit all fields
        const allowedUpdateKeys = Object.keys(updates).filter(
          (key) =>
            key !== "author" &&
            key !== "createdAt" &&
            key !== "_id" &&
            key !== "id"
        );

        console.log("🔑 Allowed update keys for admin:", allowedUpdateKeys);

        allowedUpdateKeys.forEach((key) => {
          console.log(
            `📝 Updating ${key}: ${(post as any)[key]} → ${updates[key]}`
          );
          (post as any)[key] = updates[key];
        });

        // Handle status changes with admin privileges
        if (updates.status) {
          const oldStatus = post.status;

          if (updates.status === "active") {
            post.approvedAt = new Date();
            post.approvedBy = new mongoose.Types.ObjectId(currentUserId);
            post.rejectedAt = undefined;
            post.rejectedBy = undefined;
            post.rejectedReason = undefined;
          } else if (updates.status === "rejected") {
            post.rejectedAt = new Date();
            post.rejectedBy = new mongoose.Types.ObjectId(currentUserId);
            post.rejectedReason = updates.reason || "Không đạt yêu cầu";
            post.approvedAt = undefined;
            post.approvedBy = undefined;
          } else if (updates.status === "pending") {
            // When restoring from deleted or changing to pending, clear approval/rejection info
            post.approvedAt = undefined;
            post.approvedBy = undefined;
            post.rejectedAt = undefined;
            post.rejectedBy = undefined;
            post.rejectedReason = undefined;
            console.log(
              `📋 Post ${id} status changed to pending - cleared approval/rejection data`
            );
          }

          // Send notifications for status changes
          try {
            if (updates.status === "active" && oldStatus !== "active") {
              await NotificationService.createPostApprovedNotification(
                post.author.toString(),
                post.title.toString(),
                post._id.toString()
              );
            } else if (
              updates.status === "rejected" &&
              oldStatus !== "rejected"
            ) {
              await NotificationService.createPostRejectedNotification(
                post.author.toString(),
                post.title.toString(),
                post._id.toString(),
                post.rejectedReason?.toString()
              );
            } else if (
              updates.status === "pending" &&
              oldStatus === "deleted"
            ) {
              // Notification for restore from deleted to pending by admin
              console.log(
                `📨 Post ${id} restored from deleted to pending by admin - notification could be sent here`
              );
            }
          } catch (error) {
            console.error("❌ Error sending notification:", error);
            // Don't fail the request for notification error
          }

          console.log(
            `✅ Post ${id} status updated from "${oldStatus}" to "${updates.status}" by admin ${currentUserId}`
          );
        }

        await post.save();
        console.log(
          `✅ Post ${id} updated successfully by admin ${currentUserId}`
        );
      }

      // Re-fetch the updated post to return complete data
      const updatedPost = await Post.findById(id).populate(
        "author",
        "username email avatar phoneNumber"
      );

      res.json({
        success: true,
        message:
          userRole === "admin"
            ? "Tin đăng đã được cập nhật thành công"
            : "Trạng thái tin đăng đã được cập nhật",
        data: { post: updatedPost },
      });
    } catch (error) {
      console.error("Error updating admin post:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật tin đăng",
      });
    }
  },

  // GET /api/admin/payments - Get all payments with filters and pagination
  getAllPayments: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string; // topup, post_payment, etc.
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      // Build query
      const query: any = {};

      // Status filter
      if (status && status !== "all") {
        query.status = status;
      }

      // Type filter (based on metadata or description)
      if (type && type !== "all") {
        if (type === "topup") {
          query.$or = [
            {
              description: { $regex: "nạp tiền|nap tien|topup", $options: "i" },
            },
            { "metadata.isTopup": true },
          ];
        } else if (type === "post_payment") {
          query.$or = [
            {
              description: {
                $regex: "thanh toán.*tin|thanh toan.*tin",
                $options: "i",
              },
            },
            { postId: { $exists: true, $ne: null } },
          ];
        }
      }

      // Date range filter
      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      const skip = (page - 1) * limit;

      // Get payments with user and post info
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "username email avatar")
        .populate("postId", "title type")
        .lean();

      // If search term is provided, filter by orderId, user name, email, or post title
      let filteredPayments = payments;
      if (search && search.trim()) {
        const searchLower = search.toLowerCase().trim();
        filteredPayments = payments.filter((payment: any) => {
          return (
            payment.orderId?.toLowerCase().includes(searchLower) ||
            payment.userId?.username?.toLowerCase().includes(searchLower) ||
            payment.userId?.email?.toLowerCase().includes(searchLower) ||
            payment.postId?.title?.toLowerCase().includes(searchLower) ||
            payment.description?.toLowerCase().includes(searchLower)
          );
        });
      }

      const total = await Payment.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      // Calculate stats
      const [totalAmount, totalTopup, totalPostPayments] = await Promise.all([
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: "completed",
              $or: [
                {
                  description: {
                    $regex: "nạp tiền|nap tien|topup",
                    $options: "i",
                  },
                },
                { "metadata.isTopup": true },
              ],
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Payment.aggregate([
          {
            $match: {
              status: "completed",
              $or: [
                {
                  description: {
                    $regex: "thanh toán.*tin|thanh toan.*tin",
                    $options: "i",
                  },
                },
                { postId: { $exists: true, $ne: null } },
              ],
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          payments: filteredPayments,
          pagination: {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
          },
          stats: {
            totalAmount: totalAmount[0]?.total || 0,
            totalTopup: totalTopup[0]?.total || 0,
            totalPostPayments: totalPostPayments[0]?.total || 0,
            totalTransactions: total,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching all payments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách giao dịch",
      });
    }
  },

  // POST /api/admin/payments/cancel-expired
  cancelExpiredPayments: async (req: Request, res: Response) => {
    try {
      // Tính thời gian 1 ngày trước
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      console.log("Checking for expired payments before:", oneDayAgo);

      // Tìm các giao dịch pending quá 1 ngày
      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: oneDayAgo },
      });

      console.log(`Found ${expiredPayments.length} expired payments`);

      if (expiredPayments.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Không có giao dịch nào cần hủy",
          cancelledCount: 0,
        });
      }

      // Cập nhật trạng thái thành cancelled
      const updateResult = await Payment.updateMany(
        {
          status: "pending",
          createdAt: { $lt: oneDayAgo },
        },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
            cancelledAt: new Date(),
            cancelReason: "Tự động hủy sau 24 giờ",
          },
        }
      );

      console.log(
        `Updated ${updateResult.modifiedCount} payments to cancelled`
      );

      res.status(200).json({
        success: true,
        message: `Đã hủy ${updateResult.modifiedCount} giao dịch quá hạn`,
        cancelledCount: updateResult.modifiedCount,
        expiredPayments: expiredPayments.map((p) => ({
          orderId: p.orderId,
          amount: p.amount,
          description: p.description,
          createdAt: p.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error cancelling expired payments:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy giao dịch quá hạn",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
