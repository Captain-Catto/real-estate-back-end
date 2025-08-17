import { Request, Response } from "express";
import mongoose from "mongoose";
import CustomerContact from "../models/CustomerContact";
import { Post } from "../models/Post";
import { User } from "../models/User";
import { NotificationService } from "../services/NotificationService";
import { AuthenticatedRequest } from "../middleware/auth";

export class CustomerContactController {
  // User tạo yêu cầu gọi lại
  static async createCallBackRequest(req: AuthenticatedRequest, res: Response) {
    console.log("bắt đầu việc tạo call back");
    try {
      const { postId, notes } = req.body;
      const userId = req.user?.userId;

      console.log("🔍 createCallBackRequest called with:", {
        postId,
        notes,
        userId,
      });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập để sử dụng tính năng này",
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID là bắt buộc",
        });
      }

      // Kiểm tra post có tồn tại không
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy bài viết",
        });
      }

      // Kiểm tra xem đã có yêu cầu từ user này cho post này chưa
      const existingContact = await CustomerContact.findOne({
        user: userId,
        post: postId,
        contactType: "call_back",
      });

      if (existingContact) {
        // Nếu đã có, chỉ update thời gian và notes
        existingContact.updatedAt = new Date();
        if (notes) existingContact.notes = notes;
        await existingContact.save();

        return res.status(200).json({
          success: true,
          message: "Đã cập nhật yêu cầu gọi lại",
          data: existingContact,
        });
      }

      // Tạo yêu cầu mới
      const newContact = new CustomerContact({
        user: userId,
        post: postId,
        contactType: "call_back",
        status: "pending",
        notes: notes || "",
      });

      console.log("đã tạo contact");

      await newContact.save();

      // Gửi notification cho chủ tin đăng
      try {
        // Populate post với thông tin chủ tin đăng
        const populatedPost = await Post.findById(postId).populate("author");
        const requester = await User.findById(userId);

        if (populatedPost && populatedPost.author && requester) {
          const postOwner = populatedPost.author as any;

          // Chỉ gửi notification nếu người yêu cầu khác với chủ tin đăng
          if (postOwner._id.toString() !== userId.toString()) {
            await NotificationService.createCallBackRequestNotification(
              postOwner._id,
              populatedPost.title.toString(),
              requester.username || (requester as any).name || "Khách hàng",
              requester.phoneNumber || "Chưa cập nhật",
              requester.email,
              notes
            );
          }
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Không throw error để không ảnh hưởng đến việc tạo contact request
      }

      return res.status(201).json({
        success: true,
        message: "Đã tạo yêu cầu gọi lại thành công",
        data: newContact,
      });
    } catch (error: any) {
      console.error("Error creating call back request:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo yêu cầu gọi lại",
        error: error.message,
      });
    }
  }

  // Admin lấy contact theo userId
  static async getContactsByUserId(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.userId;
      const {
        page = 1,
        limit = 20,
        type = "all", // 'all', 'sent', 'received'
      } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc",
        });
      }

      if (!currentUserId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Kiểm tra quyền: Admin/Employee có thể xem tất cả, User chỉ xem của mình
      const currentUser = await User.findById(currentUserId);
      if (!currentUser) {
        return res.status(401).json({
          success: false,
          message: "Không tìm thấy thông tin người dùng",
        });
      }

      // Chỉ admin/employee mới được xem liên hệ của người khác
      if (
        currentUser.role !== "admin" &&
        currentUser.role !== "employee" &&
        currentUserId !== userId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Bạn không có quyền xem thông tin liên hệ của người dùng khác",
        });
      }

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID là bắt buộc",
        });
      }

      const skip = (Number(page) - 1) * Number(limit);
      let queries: any[] = [];

      if (type === "sent" || type === "all") {
        // Contacts sent by user
        queries.push({ user: userId });
      }

      if (type === "received" || type === "all") {
        // Contacts received by user's posts
        const userPosts = await Post.find({ author: userId }).select("_id");
        const userPostIds = userPosts.map((post) => post._id);
        if (userPostIds.length > 0) {
          queries.push({ post: { $in: userPostIds } });
        }
      }

      if (queries.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            contacts: [],
            pagination: {
              currentPage: Number(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: Number(limit),
            },
          },
        });
      }

      const query = queries.length === 1 ? queries[0] : { $or: queries };

      const [contacts, totalContacts] = await Promise.all([
        CustomerContact.find(query)
          .populate("user", "username email phone avatar")
          .populate("post", "title slug images price location")
          .populate("contactedBy", "username email")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        CustomerContact.countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalContacts / Number(limit));

      return res.status(200).json({
        success: true,
        data: {
          contacts,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalItems: totalContacts,
            itemsPerPage: Number(limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting contacts by user ID:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách liên hệ",
        error: error.message,
      });
    }
  }

  // Admin/Employee lấy danh sách yêu cầu liên hệ
  static async getContactRequests(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        contactType,
        search,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const skip = (Number(page) - 1) * Number(limit);
      const query: any = {};

      // Filter theo status
      if (status) {
        query.status = status;
      }

      // Filter theo contactType
      if (contactType) {
        query.contactType = contactType;
      }

      // Search theo tên user hoặc title post
      let searchQuery = {};
      if (search) {
        const users = await User.find({
          $or: [
            { username: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        const posts = await Post.find({
          title: { $regex: search, $options: "i" },
        }).select("_id");

        searchQuery = {
          $or: [
            { user: { $in: users.map((u: any) => u._id) } },
            { post: { $in: posts.map((p: any) => p._id) } },
          ],
        };
      }

      const finalQuery = { ...query, ...searchQuery };

      // Sort
      const sort: any = {};
      sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

      const contacts = await CustomerContact.find(finalQuery)
        .populate("user", "username email phone avatar")
        .populate("post", "title slug images price location")
        .populate("contactedBy", "username email")
        .sort(sort)
        .skip(skip)
        .limit(Number(limit));

      const total = await CustomerContact.countDocuments(finalQuery);

      return res.status(200).json({
        success: true,
        data: {
          contacts,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            totalItems: total,
            itemsPerPage: Number(limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting contact requests:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách yêu cầu liên hệ",
        error: error.message,
      });
    }
  }

  // Admin/Employee cập nhật trạng thái liên hệ
  static async updateContactStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { contactId } = req.params;
      const { status, notes } = req.body;
      const userId = req.user?.userId;

      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: "Contact ID là bắt buộc",
        });
      }

      const contact = await CustomerContact.findById(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu liên hệ",
        });
      }

      // Cập nhật thông tin
      if (status) contact.status = status;
      if (notes) contact.notes = notes;

      // Nếu status là contacted hoặc completed, lưu thông tin người liên hệ
      if (status === "contacted" || status === "completed") {
        contact.contactedBy = new mongoose.Types.ObjectId(userId);
        contact.contactedAt = new Date();
      }

      await contact.save();

      // Populate để trả về thông tin đầy đủ
      await contact.populate("user", "username email phone avatar");
      await contact.populate("post", "title slug images price location");
      await contact.populate("contactedBy", "username email");

      return res.status(200).json({
        success: true,
        message: "Đã cập nhật trạng thái liên hệ",
        data: contact,
      });
    } catch (error: any) {
      console.error("Error updating contact status:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái",
        error: error.message,
      });
    }
  }

  // Admin/Employee xóa yêu cầu liên hệ
  static async deleteContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: "Contact ID là bắt buộc",
        });
      }

      const contact = await CustomerContact.findByIdAndDelete(contactId);
      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu liên hệ",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Đã xóa yêu cầu liên hệ",
      });
    } catch (error: any) {
      console.error("Error deleting contact:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa yêu cầu liên hệ",
        error: error.message,
      });
    }
  }

  // Lấy thống kê yêu cầu liên hệ
  static async getContactStats(req: AuthenticatedRequest, res: Response) {
    try {
      const totalContacts = await CustomerContact.countDocuments();
      const pendingContacts = await CustomerContact.countDocuments({
        status: "pending",
      });
      const contactedContacts = await CustomerContact.countDocuments({
        status: "contacted",
      });
      const completedContacts = await CustomerContact.countDocuments({
        status: "completed",
      });

      // Thống kê theo ngày (7 ngày gần nhất)
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const dailyStats = await CustomerContact.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalContacts,
          pendingContacts,
          contactedContacts,
          completedContacts,
          dailyStats,
        },
      });
    } catch (error: any) {
      console.error("Error getting contact stats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  // User xem ai đã liên hệ với bài viết của họ
  static async getUserContacts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const {
        page = 1,
        limit = 10,
        status,
        contactType,
        sortBy = "createdAt",
        sortOrder = "desc",
        includeDeleted = "false", // Mặc định không bao gồm contact đã ẩn
      } = req.query;

      console.log("🔍 getUserContacts called for userId:", userId);
      console.log("📋 Query params:", {
        page,
        limit,
        status,
        contactType,
        sortBy,
        sortOrder,
        includeDeleted,
      });

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      const skip = (Number(page) - 1) * Number(limit);

      // Tìm các post của user
      const userPosts = await Post.find({ author: userId }).select("_id");
      const userPostIds = userPosts.map((post) => post._id);

      console.log("📝 User posts found:", userPostIds.length);
      console.log("📝 User post IDs:", userPostIds);

      if (userPostIds.length === 0) {
        console.log("❌ No posts found for user");
        return res.status(200).json({
          success: true,
          data: {
            contacts: [],
            pagination: {
              currentPage: Number(page),
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: Number(limit),
            },
          },
        });
      }

      const query: any = {
        post: { $in: userPostIds },
      };

      // Chỉ loại bỏ contact đã xóa nếu includeDeleted = false
      if (includeDeleted !== "true") {
        query.status = { $ne: "deleted" };
      }

      // Filter theo status
      if (status && status !== "all") {
        query.status = status;
      }

      // Filter theo contactType
      if (contactType && contactType !== "all") {
        query.contactType = contactType;
      }

      console.log("🔍 Contact query:", query);

      // Sort options
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

      const [contacts, totalContacts] = await Promise.all([
        CustomerContact.find(query)
          .populate("user", "username email phoneNumber avatar") // Thông tin người yêu cầu liên hệ
          .populate("post", "title slug images price location")
          .populate("contactedBy", "username email")
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit)),
        CustomerContact.countDocuments(query),
      ]);

      console.log("📞 Contacts found:", contacts.length);
      console.log("📊 Total contacts:", totalContacts);

      const totalPages = Math.ceil(totalContacts / Number(limit));

      return res.status(200).json({
        success: true,
        data: {
          contacts,
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalItems: totalContacts,
            itemsPerPage: Number(limit),
          },
        },
      });
    } catch (error: any) {
      console.error("Error getting user contacts:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách liên hệ",
        error: error.message,
      });
    }
  }

  // User xem thống kê liên hệ bài viết của họ
  static async getUserContactStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Tìm các post của user
      const userPosts = await Post.find({ author: userId }).select("_id");
      const userPostIds = userPosts.map((post) => post._id);

      if (userPostIds.length === 0) {
        return res.status(200).json({
          success: true,
          data: {
            totalContacts: 0,
            pendingContacts: 0,
            contactedContacts: 0,
            totalPosts: 0,
            postsWithContacts: 0,
          },
        });
      }

      const [
        totalContacts,
        pendingContacts,
        contactedContacts,
        postsWithContacts,
      ] = await Promise.all([
        CustomerContact.countDocuments({
          post: { $in: userPostIds },
          status: { $ne: "deleted" }, // Loại bỏ contacts đã soft delete
        }),
        CustomerContact.countDocuments({
          post: { $in: userPostIds },
          status: "pending",
        }),
        CustomerContact.countDocuments({
          post: { $in: userPostIds },
          status: "contacted",
        }),
        CustomerContact.distinct("post", {
          post: { $in: userPostIds },
          status: { $ne: "deleted" },
        }).then((posts) => posts.length),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalContacts,
          pendingContacts,
          contactedContacts,
          totalPosts: userPosts.length,
          postsWithContacts,
        },
      });
    } catch (error: any) {
      console.error("Error getting user contact stats:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê",
        error: error.message,
      });
    }
  }

  // User soft delete contact (chuyển status sang deleted)
  static async softDeleteContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { contactId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Tìm contact và kiểm tra quyền
      const contact = await CustomerContact.findById(contactId).populate(
        "post",
        "author"
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu liên hệ",
        });
      }

      // Kiểm tra quyền: chỉ chủ bài viết mới được xóa
      if ((contact.post as any).author.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa yêu cầu liên hệ này",
        });
      }

      // Soft delete: chuyển status sang deleted và set thời gian auto delete
      const autoDeleteAt = new Date();
      autoDeleteAt.setDate(autoDeleteAt.getDate() + 30); // 30 ngày sau

      contact.status = "deleted";
      contact.deletedAt = new Date();
      contact.deletedBy = new mongoose.Types.ObjectId(userId);
      contact.autoDeleteAt = autoDeleteAt;
      await contact.save();

      return res.status(200).json({
        success: true,
        message: "Đã ẩn yêu cầu liên hệ",
        data: { contactId },
      });
    } catch (error: unknown) {
      console.error("Error soft deleting contact:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể xóa yêu cầu liên hệ",
      });
    }
  }

  // Admin hard delete contact
  static async hardDeleteContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { contactId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Kiểm tra quyền admin
      const user = await User.findById(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền xóa vĩnh viễn yêu cầu liên hệ",
        });
      }

      const contact = await CustomerContact.findById(contactId);

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu liên hệ",
        });
      }

      await CustomerContact.findByIdAndDelete(contactId);

      return res.status(200).json({
        success: true,
        message: "Đã xóa vĩnh viễn yêu cầu liên hệ",
        data: { contactId },
      });
    } catch (error: unknown) {
      console.error("Error hard deleting contact:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể xóa yêu cầu liên hệ",
      });
    }
  }

  // User khôi phục contact đã soft delete
  static async restoreContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { contactId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Vui lòng đăng nhập",
        });
      }

      // Tìm contact và kiểm tra quyền
      const contact = await CustomerContact.findById(contactId).populate(
        "post",
        "author"
      );

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy yêu cầu liên hệ",
        });
      }

      // Lấy thông tin user để kiểm tra role
      const user = await User.findById(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Kiểm tra quyền: chủ bài viết hoặc admin mới được khôi phục
      const isOwner = (contact.post as any).author.toString() === userId;
      const isAdmin = user.role === "admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền khôi phục yêu cầu liên hệ này",
        });
      }

      // Chỉ có thể khôi phục contact có status "deleted"
      if (contact.status !== "deleted") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể khôi phục yêu cầu liên hệ đã bị ẩn",
        });
      }

      // Khôi phục: chuyển status về "pending" và xóa các thông tin delete
      contact.status = "pending";
      contact.deletedAt = undefined;
      contact.deletedBy = undefined;
      contact.autoDeleteAt = undefined;
      await contact.save();

      return res.status(200).json({
        success: true,
        message: "Đã khôi phục yêu cầu liên hệ",
        data: { contactId },
      });
    } catch (error: unknown) {
      console.error("Error restoring contact:", error);
      return res.status(500).json({
        success: false,
        message: "Không thể khôi phục yêu cầu liên hệ",
      });
    }
  }
}
