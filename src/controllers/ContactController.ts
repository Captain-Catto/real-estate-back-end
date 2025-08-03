import { Request, Response } from "express";
import { ContactMessage, IContactMessage } from "../models/ContactMessage";
import ContactLog from "../models/ContactLog";

export class ContactController {
  // Validate contact message data
  private static validateContactMessage(data: any) {
    const errors: string[] = [];

    if (!data.name || !data.name.trim()) {
      errors.push("Tên là bắt buộc");
    } else if (data.name.trim().length > 100) {
      errors.push("Tên không được vượt quá 100 ký tự");
    }

    if (!data.email || !data.email.trim()) {
      errors.push("Email là bắt buộc");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.push("Email không hợp lệ");
    }

    if (
      data.phone &&
      data.phone.trim() &&
      !/^[0-9+\-\s()]+$/.test(data.phone.trim())
    ) {
      errors.push("Số điện thoại không hợp lệ");
    }

    if (!data.subject || !data.subject.trim()) {
      errors.push("Tiêu đề là bắt buộc");
    } else if (data.subject.trim().length > 200) {
      errors.push("Tiêu đề không được vượt quá 200 ký tự");
    }

    if (!data.message || !data.message.trim()) {
      errors.push("Nội dung tin nhắn là bắt buộc");
    } else if (data.message.trim().length > 2000) {
      errors.push("Nội dung không được vượt quá 2000 ký tự");
    }

    return errors;
  }

  // Public endpoint - Create contact message
  static async createContactMessage(req: Request, res: Response) {
    try {
      // Validate input data
      const errors = ContactController.validateContactMessage(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors,
        });
      }

      const { name, email, phone, subject, message } = req.body;

      // Create new contact message
      const contactMessage = new ContactMessage({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });

      await contactMessage.save();

      res.status(201).json({
        success: true,
        message:
          "Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.",
        data: {
          _id: contactMessage._id,
          name: contactMessage.name,
          email: contactMessage.email,
          subject: contactMessage.subject,
          createdAt: contactMessage.createdAt,
        },
      });
    } catch (error: any) {
      console.error("Create contact message error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi gửi tin nhắn",
      });
    }
  }

  // Update contact log note
  static async updateContactLogNote(req: Request, res: Response) {
    try {
      const { logId } = req.params;
      const { note } = req.body;

      if (!logId) {
        return res.status(400).json({
          success: false,
          message: "logId là bắt buộc",
        });
      }

      const log = await ContactLog.findById(logId);

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy log",
        });
      }

      // Update note
      log.note = note?.trim() || "";
      await log.save();

      res.json({
        success: true,
        message: "Cập nhật ghi chú thành công",
        data: log,
      });
    } catch (error: any) {
      console.error("Update contact log note error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật ghi chú",
      });
    }
  }

  // Admin endpoints
  static async getContactMessages(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;

      // Build query
      let query: any = {};

      if (status && ["new", "read", "replied", "closed"].includes(status)) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
          { message: { $regex: search, $options: "i" } },
        ];
      }

      // Get messages with pagination
      const [messages, total] = await Promise.all([
        ContactMessage.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ContactMessage.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({
        success: true,
        message: "Lấy danh sách tin nhắn thành công",
        data: {
          messages,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        },
      });
    } catch (error: any) {
      console.error("Get contact messages error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách tin nhắn",
      });
    }
  }

  static async getContactMessageById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const contactMessage = await ContactMessage.findById(id);

      if (!contactMessage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin nhắn",
        });
      }

      // Mark as read if it's new
      if (contactMessage.status === "new") {
        contactMessage.status = "read";
        await contactMessage.save();
      }

      res.json({
        success: true,
        message: "Lấy tin nhắn thành công",
        data: contactMessage,
      });
    } catch (error: any) {
      console.error("Get contact message by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy tin nhắn",
      });
    }
  }

  static async updateContactMessageStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, replyMessage, note } = req.body;

      if (!["new", "read", "replied", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      const contactMessage = await ContactMessage.findById(id);

      if (!contactMessage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin nhắn",
        });
      }

      const oldStatus = contactMessage.status;

      // Update status
      contactMessage.status = status;

      // If replying, set reply info
      if (status === "replied" && replyMessage) {
        contactMessage.repliedAt = new Date();
        contactMessage.repliedBy = (req as any).user?.name || "Admin";
        contactMessage.replyMessage = replyMessage.trim();
      }

      await contactMessage.save();

      // Create log entry
      const user = (req as any).user;
      console.log("User info for logging:", {
        user,
        id: user?.id,
        _id: user?._id,
        name: user?.name,
        email: user?.email,
      });

      const statusLabels = {
        new: "Mới",
        read: "Đã đọc",
        replied: "Đã trả lời",
        closed: "Đã đóng",
      };

      try {
        let description = `Thay đổi trạng thái từ "${
          statusLabels[oldStatus as keyof typeof statusLabels]
        }" thành "${statusLabels[status as keyof typeof statusLabels]}"`;

        if (note && note.trim()) {
          description += `. Ghi chú: ${note.trim()}`;
        }

        const logEntry = await ContactLog.create({
          contactId: id,
          action: "status_change",
          oldValue: oldStatus,
          newValue: status,
          description,
          performedBy: {
            _id: user?.userId || user?.id || user?._id || "system",
            name: user?.username || user?.name || "Hệ thống",
            email: user?.email || "system@example.com",
          },
        });
        console.log("Log entry created:", logEntry);
      } catch (logError) {
        console.error("Error creating status change log:", logError);
        // Don't fail the main operation if logging fails
      }

      res.json({
        success: true,
        message: "Cập nhật trạng thái thành công",
        data: contactMessage,
      });
    } catch (error: any) {
      console.error("Update contact message status error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật trạng thái",
      });
    }
  }

  // Update contact message content
  static async replyToContactMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { replyMessage } = req.body;

      if (!replyMessage || !replyMessage.trim()) {
        return res.status(400).json({
          success: false,
          message: "Nội dung phản hồi là bắt buộc",
        });
      }

      const contactMessage = await ContactMessage.findById(id);

      if (!contactMessage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin nhắn",
        });
      }

      // Mark as replied
      contactMessage.status = "replied";
      contactMessage.repliedAt = new Date();
      contactMessage.repliedBy = (req as any).user?.name || "Admin";
      contactMessage.replyMessage = replyMessage.trim();

      await contactMessage.save();

      res.json({
        success: true,
        message: "Phản hồi đã được gửi thành công",
        data: contactMessage,
      });
    } catch (error: any) {
      console.error("Reply to contact message error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi gửi phản hồi",
      });
    }
  }

  static async deleteContactMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const contactMessage = await ContactMessage.findById(id);

      if (!contactMessage) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tin nhắn",
        });
      }

      await ContactMessage.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa tin nhắn thành công",
      });
    } catch (error: any) {
      console.error("Delete contact message error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi xóa tin nhắn",
      });
    }
  }

  static async getContactStats(req: Request, res: Response) {
    try {
      // Get stats using aggregation pipeline
      const stats = await ContactMessage.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Initialize result with default values
      const result = {
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        closed: 0,
      };

      // Calculate total and individual status counts
      stats.forEach((stat) => {
        result.total += stat.count;
        if (
          stat._id &&
          typeof result[stat._id as keyof typeof result] === "number"
        ) {
          (result as any)[stat._id] = stat.count;
        }
      });

      res.json({
        success: true,
        message: "Lấy thống kê tin nhắn thành công",
        data: result,
      });
    } catch (error: any) {
      console.error("Get contact stats error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê",
      });
    }
  }

  static async bulkUpdateStatus(req: Request, res: Response) {
    try {
      const { ids, status } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Danh sách ID không hợp lệ",
        });
      }

      if (!["new", "read", "replied", "closed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      const result = await ContactMessage.updateMany(
        { _id: { $in: ids } },
        { status }
      );

      res.json({
        success: true,
        message: `Cập nhật ${result.modifiedCount} tin nhắn thành công`,
        data: {
          modifiedCount: result.modifiedCount,
        },
      });
    } catch (error: any) {
      console.error("Bulk update status error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật hàng loạt",
      });
    }
  }

  // Create contact log
  static async createContactLog(req: Request, res: Response) {
    try {
      const { contactId, action, oldValue, newValue, description } = req.body;
      const user = (req as any).user;

      if (!contactId || !action || !description) {
        return res.status(400).json({
          success: false,
          message: "contactId, action và description là bắt buộc",
        });
      }

      const log = new ContactLog({
        contactId,
        action,
        oldValue,
        newValue,
        description,
        performedBy: {
          _id: user.userId || user.id,
          name: user.username || user.name,
          email: user.email,
        },
      });

      await log.save();

      res.status(201).json({
        success: true,
        message: "Tạo log thành công",
        data: log,
      });
    } catch (error: any) {
      console.error("Create contact log error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tạo log",
      });
    }
  }

  // Get contact logs
  static async getContactLogs(req: Request, res: Response) {
    try {
      const { contactId } = req.params;

      if (!contactId) {
        return res.status(400).json({
          success: false,
          message: "contactId là bắt buộc",
        });
      }

      const logs = await ContactLog.find({ contactId })
        .sort({ performedAt: -1 })
        .lean();

      console.log(`Found ${logs.length} logs for contact ${contactId}:`, logs);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      console.error("Get contact logs error:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy logs",
      });
    }
  }
}
