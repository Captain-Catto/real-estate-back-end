import { Notification } from "../models";
import { Post } from "../models";
import { LocationModel } from "../models/Location";
import mongoose from "mongoose";

export interface CreateNotificationData {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type:
    | "PAYMENT"
    | "POST_APPROVED"
    | "POST_REJECTED"
    | "PACKAGE_PURCHASE"
    | "SYSTEM"
    | "INTEREST";
  data?: any;
}

/**
 * Utility function để tạo slug từ tên địa danh
 */
function createLocationSlug(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Utility function để tạo URL SEO cho tin đăng
 */
async function generatePostUrl(postId: string): Promise<string> {
  try {
    // Lấy thông tin post từ database
    const post = await Post.findById(postId).populate("author");
    if (!post) {
      console.log(`⚠️ Post not found: ${postId}`);
      return `/tin-dang/${postId}`;
    }

    // Tạo title slug từ title của post
    const titleSlug = createLocationSlug(String(post.title));
    const idSlug = `${postId}-${titleSlug}`;

    console.log(`🔗 Generating URL for post: ${post.title}`);
    console.log(`📍 Location data:`, post.location);

    // Kiểm tra xem có đủ thông tin location không
    if (
      post.location?.province &&
      post.location?.district &&
      post.location?.ward
    ) {
      // Xác định transaction type từ post.type
      const transactionType = post.type === "ban" ? "mua-ban" : "cho-thue";

      // Convert location names to slugs
      let provinceSlug = "";
      let districtSlug = "";
      let wardSlug = "";

      // Nếu location được lưu dưới dạng code, cần convert sang tên
      if (!isNaN(Number(post.location.province))) {
        console.log(`🔢 Converting location codes to slugs`);
        // Location được lưu dưới dạng code, cần convert
        const province = await LocationModel.findOne({
          code: Number(post.location.province),
        });
        if (province) {
          provinceSlug =
            province.codename || createLocationSlug(String(province.name));

          const district = province.districts.find(
            (d: any) => d.code === Number(post.location.district)
          );
          if (district) {
            districtSlug =
              district.codename || createLocationSlug(String(district.name));

            const ward = district.wards.find(
              (w: any) => w.code === Number(post.location.ward)
            );
            if (ward) {
              wardSlug = ward.codename || createLocationSlug(String(ward.name));
            }
          }
        }
      } else {
        console.log(`📝 Using location names directly`);
        // Location đã được lưu dưới dạng tên, convert sang slug
        provinceSlug = createLocationSlug(String(post.location.province));
        districtSlug = createLocationSlug(String(post.location.district));
        wardSlug = createLocationSlug(String(post.location.ward));
      }

      if (provinceSlug && districtSlug && wardSlug) {
        const seoUrl = `/${transactionType}/${provinceSlug}/${districtSlug}/${wardSlug}/${idSlug}`;
        console.log(`✅ Generated SEO URL: ${seoUrl}`);
        return seoUrl;
      } else {
        console.log(
          `⚠️ Missing location slugs: province=${provinceSlug}, district=${districtSlug}, ward=${wardSlug}`
        );
      }
    }

    // Fallback nếu không có đủ thông tin location
    const transactionType = post.type === "ban" ? "mua-ban" : "cho-thue";
    const fallbackUrl = `/${transactionType}/chi-tiet/${idSlug}`;
    console.log(`🔄 Using fallback URL: ${fallbackUrl}`);
    return fallbackUrl;
  } catch (error) {
    console.error("❌ Error generating post URL:", error);
    return `/tin-dang/${postId}`;
  }
}

export class NotificationService {
  /**
   * Tạo notification mới
   */
  static async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      const notification = new Notification({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        data: data.data || {},
        read: false,
      });

      await notification.save();
      console.log(
        `✅ Notification created for user ${data.userId}: ${data.title}`
      );
    } catch (error) {
      console.error("❌ Error creating notification:", error);
    }
  }

  /**
   * Notification khi user nạp tiền thành công
   */
  static async createTopUpSuccessNotification(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    orderId: string
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat("vi-VN").format(amount);

    await this.createNotification({
      userId,
      title: "💰 Nạp tiền thành công",
      message: `Bạn đã nạp thành công ${formattedAmount} VND vào tài khoản. Số dư hiện tại đã được cập nhật.`,
      type: "PAYMENT",
      data: {
        orderId,
        amount,
        action: "topup",
        actionButton: {
          text: "Xem ví",
          link: "/nguoi-dung/vi-tien",
          style: "primary",
        },
      },
    });
  }

  /**
   * Notification khi user thanh toán gói tin đăng thành công
   */
  static async createPackagePurchaseNotification(
    userId: string | mongoose.Types.ObjectId,
    packageName: string,
    amount: number,
    orderId: string,
    duration: number
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat("vi-VN").format(amount);

    await this.createNotification({
      userId,
      title: "🎉 Mua gói tin thành công",
      message: `Bạn đã mua thành công gói "${packageName}" với giá ${formattedAmount} VND. Gói có hiệu lực ${duration} ngày.`,
      type: "PACKAGE_PURCHASE",
      data: {
        orderId,
        packageName,
        amount,
        duration,
        action: "package_purchase",
        actionButton: {
          text: "Đăng tin ngay",
          link: "/nguoi-dung/dang-tin",
          style: "success",
        },
      },
    });
  }

  /**
   * Notification khi tin đăng được duyệt
   */
  static async createPostApprovedNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string
  ): Promise<void> {
    // Generate SEO URL for the post
    const postUrl = await generatePostUrl(postId);

    await this.createNotification({
      userId,
      title: "✅ Tin đăng được duyệt",
      message: `Tin đăng "${postTitle}" của bạn đã được duyệt và hiển thị công khai. Khách hàng có thể xem và liên hệ với bạn.`,
      type: "POST_APPROVED",
      data: {
        postId,
        postTitle,
        action: "post_approved",
        actionButton: {
          text: "Xem tin đăng",
          link: postUrl,
          style: "primary",
        },
      },
    });
  }

  /**
   * Notification khi tin đăng bị từ chối
   */
  static async createPostRejectedNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string,
    reason?: string
  ): Promise<void> {
    const message = reason
      ? `Tin đăng "${postTitle}" của bạn đã bị từ chối. Lý do: ${reason}. Vui lòng chỉnh sửa và gửi lại.`
      : `Tin đăng "${postTitle}" của bạn đã bị từ chối. Vui lòng kiểm tra và chỉnh sửa lại nội dung.`;

    await this.createNotification({
      userId,
      title: "❌ Tin đăng bị từ chối",
      message,
      type: "POST_REJECTED",
      data: {
        postId,
        postTitle,
        reason,
        action: "post_rejected",
        actionButton: {
          text: "Chỉnh sửa tin",
          link: `/nguoi-dung/tin-dang/chinh-sua/${postId}`,
          style: "warning",
        },
      },
    });
  }

  /**
   * Notification khi có user quan tâm tin đăng
   */
  static async createInterestNotification(
    userId: string | mongoose.Types.ObjectId,
    postTitle: string,
    postId: string,
    interestedUserName: string
  ): Promise<void> {
    // Generate SEO URL for the post
    const postUrl = await generatePostUrl(postId);

    await this.createNotification({
      userId,
      title: "💖 Có người quan tâm tin đăng",
      message: `${interestedUserName} đã quan tâm đến tin đăng "${postTitle}" của bạn. Hãy liên hệ để trao đổi thêm!`,
      type: "INTEREST",
      data: {
        postId,
        postTitle,
        interestedUserName,
        action: "post_interest",
        actionButton: {
          text: "Xem tin đăng",
          link: postUrl,
          style: "info",
        },
      },
    });
  }

  /**
   * Notification hệ thống (thông báo chung)
   */
  static async createSystemNotification(
    userId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.createNotification({
      userId,
      title,
      message,
      type: "SYSTEM",
      data: {
        ...data,
        action: "system",
        actionButton: data?.actionButton || {
          text: "Tìm hiểu thêm",
          link: "/",
          style: "secondary",
        },
      },
    });
  }

  /**
   * Gửi notification broadcast cho nhiều users
   */
  static async createBroadcastNotification(
    userIds: (string | mongoose.Types.ObjectId)[],
    title: string,
    message: string,
    type:
      | "SYSTEM"
      | "PAYMENT"
      | "POST_APPROVED"
      | "POST_REJECTED"
      | "PACKAGE_PURCHASE"
      | "INTEREST",
    data?: any
  ): Promise<void> {
    try {
      const notifications = userIds.map((userId) => ({
        userId,
        title,
        message,
        type,
        data: data || {},
        read: false,
      }));

      await Notification.insertMany(notifications);
      console.log(
        `✅ Broadcast notification sent to ${userIds.length} users: ${title}`
      );
    } catch (error) {
      console.error("❌ Error creating broadcast notification:", error);
    }
  }

  /**
   * Xóa notifications cũ (quá 30 ngày)
   */
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        read: true,
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error("❌ Error cleaning up notifications:", error);
    }
  }
}
