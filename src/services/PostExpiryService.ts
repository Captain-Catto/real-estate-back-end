import * as cron from "node-cron";
import { Post } from "../models/Post";
import { Notification } from "../models";

export class PostExpiryService {
  private static instance: PostExpiryService;
  private isSchedulerRunning = false;

  private constructor() {}

  public static getInstance(): PostExpiryService {
    if (!PostExpiryService.instance) {
      PostExpiryService.instance = new PostExpiryService();
    }
    return PostExpiryService.instance;
  }

  /**
   * Khởi động scheduled job để kiểm tra và cập nhật expired posts
   * Chạy mỗi ngày lúc 2:00 AM
   */
  public startScheduler(): void {
    if (this.isSchedulerRunning) {
      console.log("🔄 Post expiry scheduler is already running");
      return;
    }

    // Chạy mỗi ngày lúc 2:00 AM
    cron.schedule("0 2 * * *", async () => {
      console.log("🕐 Running daily post expiry check at", new Date());
      await this.checkAndUpdateExpiredPosts();
    });

    this.isSchedulerRunning = true;
    console.log("✅ Post expiry scheduler started successfully");

    // Chạy ngay lập tức khi khởi động server (để test)
    console.log("🚀 Running initial post expiry check...");
    this.checkAndUpdateExpiredPosts();
  }

  /**
   * Kiểm tra và cập nhật status của các posts đã hết hạn
   */
  public async checkAndUpdateExpiredPosts(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    try {
      const now = new Date();
      
      console.log("🔍 Checking for expired posts...");
      
      // Tìm tất cả posts active nhưng đã hết hạn
      const expiredPosts = await Post.find({
        status: "active",
        expiredAt: { $exists: true, $lt: now },
      }).select("_id title author expiredAt");

      console.log(`📊 Found ${expiredPosts.length} expired posts to update`);

      if (expiredPosts.length === 0) {
        const message = "No expired posts found";
        console.log("✅ " + message);
        return {
          success: true,
          updatedCount: 0,
          message,
        };
      }

      // Cập nhật status thành "expired"
      const updateResult = await Post.updateMany(
        {
          status: "active",
          expiredAt: { $exists: true, $lt: now },
        },
        {
          $set: {
            status: "expired",
            updatedAt: now,
          },
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} posts to expired status`);

      // Gửi thông báo cho các user có posts bị hết hạn
      try {
        await this.notifyUsersAboutExpiredPosts(expiredPosts);
      } catch (notificationError) {
        console.error("⚠️ Error sending notifications:", notificationError);
        // Không throw error vì việc cập nhật status đã thành công
      }

      return {
        success: true,
        updatedCount: updateResult.modifiedCount,
        message: `Successfully updated ${updateResult.modifiedCount} expired posts`,
      };
    } catch (error) {
      const errorMessage = `Error checking expired posts: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error("❌ " + errorMessage, error);
      
      return {
        success: false,
        updatedCount: 0,
        message: errorMessage,
      };
    }
  }

  /**
   * Gửi thông báo cho users về posts đã hết hạn
   */
  private async notifyUsersAboutExpiredPosts(expiredPosts: any[]): Promise<void> {
    // Group posts by user
    const userPostsMap = new Map<string, any[]>();
    
    expiredPosts.forEach(post => {
      const userId = post.author.toString();
      if (!userPostsMap.has(userId)) {
        userPostsMap.set(userId, []);
      }
      userPostsMap.get(userId)!.push(post);
    });

    // Gửi thông báo cho từng user
    for (const [userId, posts] of userPostsMap.entries()) {
      try {
        const postTitles = posts.map(p => p.title).join(", ");
        const message = posts.length === 1 
          ? `Bài đăng "${posts[0].title}" của bạn đã hết hạn`
          : `${posts.length} bài đăng của bạn đã hết hạn: ${postTitles}`;

        // Tạo notification trực tiếp
        await Notification.create({
          userId: userId,
          type: "POST_EXPIRED",
          title: "Bài đăng đã hết hạn",
          message,
          data: {
            expiredPostIds: posts.map(p => p._id),
            expiredCount: posts.length,
          },
          read: false,
        });

        console.log(`📧 Sent expiry notification to user ${userId} for ${posts.length} posts`);
      } catch (error) {
        console.error(`❌ Error sending notification to user ${userId}:`, error);
      }
    }
  }

  /**
   * Dừng scheduled job (để test hoặc shutdown)
   */
  public stopScheduler(): void {
    cron.getTasks().forEach(task => task.destroy());
    this.isSchedulerRunning = false;
    console.log("🛑 Post expiry scheduler stopped");
  }

  /**
   * Kiểm tra trạng thái scheduler
   */
  public getStatus(): { isRunning: boolean; tasksCount: number } {
    return {
      isRunning: this.isSchedulerRunning,
      tasksCount: cron.getTasks().size,
    };
  }

  /**
   * Manual trigger để admin có thể chạy thủ công
   */
  public async runManualCheck(): Promise<{
    success: boolean;
    updatedCount: number;
    message: string;
  }> {
    console.log("🔧 Manual post expiry check triggered");
    return await this.checkAndUpdateExpiredPosts();
  }
}