import { INews } from "../models/News";
import mongoose from "mongoose";
import { News } from "../models/News";
import { logger } from "../utils/logger";

// Service for handling news-related functionality
export class NewsService {
  /**
   * Calculate the estimated reading time based on content length
   * @param content The news article content
   * @returns Estimated reading time in minutes
   */
  calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  /**
   * Generate a slug from a title
   * @param title News title
   * @returns A URL-friendly slug
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize("NFD") // Normalize diacritics
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric chars except spaces and hyphens
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  }

  /**
   * Extract an excerpt from content
   * @param content The full content
   * @param maxLength Maximum length of the excerpt
   * @returns A short excerpt from the content
   */
  extractExcerpt(content: string, maxLength = 200): string {
    // Remove HTML tags
    const textOnly = content.replace(/<\/?[^>]+(>|$)/g, "");

    if (textOnly.length <= maxLength) {
      return textOnly;
    }

    // Cut at the last space before maxLength to avoid cutting words
    const excerpt = textOnly.substring(0, maxLength);
    const lastSpaceIndex = excerpt.lastIndexOf(" ");

    return excerpt.substring(0, lastSpaceIndex) + "...";
  }

  /**
   * Analyze news content with AI to suggest tags or categories
   * @param content The news content to analyze
   * @returns Suggested tags or categories
   */
  async analyzeContent(title: string, content: string): Promise<string[]> {
    try {
      // This is a placeholder. In a real implementation, you would call an AI API
      // such as OpenAI's GPT or a custom NLP service

      // Mock implementation - in reality, this would be an API call
      return ["real estate", "market trends"];
    } catch (error) {
      console.error("Error analyzing content:", error);
      return [];
    }
  }

  /**
   * Send notification about new published article
   * @param news The news article data
   */
  async sendNewsNotification(news: INews): Promise<boolean> {
    try {
      // Implementation would depend on your notification system
      // This is just a placeholder
      console.log(`Notification sent for news: ${news.title}`);
      return true;
    } catch (error) {
      console.error("Error sending notification:", error);
      return false;
    }
  }

  /**
   * Sync news with external platforms (like social media)
   * @param newsId The ID of the news to sync
   * @param platforms Array of platforms to sync with
   */
  async syncWithExternalPlatforms(
    newsId: string,
    platforms: string[] = ["facebook", "twitter"]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    try {
      // This would be implemented with actual API calls to each platform
      for (const platform of platforms) {
        // Simulate API call
        results[platform] = true;
        console.log(`Synced news ${newsId} with ${platform}`);
      }
    } catch (error) {
      console.error("Error syncing with external platforms:", error);
    }

    return results;
  }

  /**
   * Schedule automatic news deletion after being unpublished for 30 days
   * @param newsId ID of the news article
   */
  async scheduleDeleteUnpublished(newsId: string): Promise<void> {
    try {
      // Get the news item
      const news = await News.findById(newsId);
      if (!news) {
        console.error(`News with ID ${newsId} not found`);
        return;
      }

      // Mark the unpublished date
      const unpublishedAt = new Date();
      await News.findByIdAndUpdate(newsId, {
        unpublishedAt,
        status: "unpublished",
      });

      console.log(`News ${newsId} marked as unpublished at ${unpublishedAt}`);

      // In a real application, you would use a task scheduler like node-cron or agenda
      // For example using node-cron:
      // cron.schedule("0 0 * * *", async () => {
      //   await this.deleteExpiredNews();
      // });
    } catch (error) {
      console.error(`Error scheduling news deletion for ${newsId}:`, error);
    }
  }

  /**
   * Delete news that have been unpublished for more than 30 days
   * This should be run as a scheduled task daily
   */
  async deleteExpiredNews(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find and delete all news that were unpublished more than 30 days ago
      const result = await News.deleteMany({
        status: "unpublished",
        unpublishedAt: { $lt: thirtyDaysAgo },
      });

      console.log(`Deleted ${result.deletedCount} expired news articles`);
    } catch (error) {
      console.error("Error deleting expired news:", error);
    }
  }

  /**
   * Get pending news articles for admin approval
   * @param page Current page number
   * @param limit Items per page
   * @returns Pending news with pagination
   */
  async getPendingNews(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;
      const query = { status: "pending" };

      const news = await News.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "username email avatar")
        .lean();

      const totalItems = await News.countDocuments(query);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        news,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      console.error("Error getting pending news:", error);
      throw error;
    }
  }

  /**
   * Approve a news article (change status to published)
   * @param newsId ID of the news article
   * @param moderatorId ID of the admin approving the article
   * @returns Updated news object
   */
  async approveNews(newsId: string, moderatorId: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(newsId)) {
        throw new Error("Invalid news ID");
      }

      const news = await News.findById(newsId);
      if (!news) {
        throw new Error("News not found");
      }

      if (news.status === "published") {
        throw new Error("News is already published");
      }

      // Update news status and add publish metadata
      news.status = "published";
      news.publishedAt = new Date();
      news.moderatedBy = new mongoose.Types.ObjectId(moderatorId);
      await news.save();

      // Send notification about newly published article
      await this.sendNewsNotification(news);

      return news;
    } catch (error) {
      console.error(`Error approving news ${newsId}:`, error);
      throw error;
    }
  }

  /**
   * Unpublish a news article (change status to unpublished)
   * @param newsId ID of the news article
   * @param reason Reason for unpublishing
   * @returns Updated news object
   */
  async unpublishNews(newsId: string, reason: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(newsId)) {
        throw new Error("Invalid news ID");
      }

      const news = await News.findById(newsId);
      if (!news) {
        throw new Error("News not found");
      }

      if (news.status === "unpublished") {
        throw new Error("News is already unpublished");
      }

      // Update news status and schedule for deletion
      news.status = "unpublished";
      news.unpublishedAt = new Date();
      news.unpublishReason = reason || "No reason provided";
      await news.save();

      // Schedule for deletion after 30 days
      await this.scheduleDeleteUnpublished(newsId);

      logger.info(`News ${newsId} was unpublished with reason: ${reason}`);
      return news;
    } catch (error) {
      logger.error(`Error unpublishing news ${newsId}:`, error);
      throw error;
    }
  }

  /**
   * Reject a pending news article
   * @param newsId ID of the news article
   * @param moderatorId ID of the moderator rejecting the article
   * @param reason Reason for rejection
   * @returns Updated news object
   */
  async rejectNews(newsId: string, moderatorId: string, reason: string) {
    try {
      if (!mongoose.Types.ObjectId.isValid(newsId)) {
        throw new Error("Invalid news ID");
      }

      const news = await News.findById(newsId);
      if (!news) {
        throw new Error("News not found");
      }

      if (news.status === "rejected") {
        throw new Error("News is already rejected");
      }

      // Update news status and add rejection metadata
      news.status = "rejected";
      news.rejectedAt = new Date();
      news.moderatedBy = new mongoose.Types.ObjectId(moderatorId);
      news.rejectionReason = reason || "No reason provided";
      await news.save();

      logger.info(
        `News ${newsId} was rejected by moderator ${moderatorId} with reason: ${reason}`
      );
      return news;
    } catch (error) {
      logger.error(`Error rejecting news ${newsId}:`, error);
      throw error;
    }
  }
}
