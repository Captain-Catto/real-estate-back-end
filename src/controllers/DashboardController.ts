import { Response } from "express";
import { AuthenticatedRequest } from "../middleware";
import { Post } from "../models/Post";
import { Contact } from "../models/Contact";

interface ContactRequestData {
  period: string;
  count: number;
  dateRange?: string; // Thêm field để hiển thị range ngày
  comparison?: {
    previousCount: number;
    change: number;
    changePercent: number;
  };
}

export class DashboardController {
  // Get contact requests statistics by period
  static async getContactRequestStats(
    req: AuthenticatedRequest,
    res: Response
  ) {
    console.log("🔍 Dashboard Controller - getContactRequestStats called");
    console.log("User from token:", req.user);
    console.log("Query params:", req.query);

    try {
      const { period = "weekly" } = req.query;
      const userId = req.user?.userId;

      if (!userId) {
        console.log("❌ No userId found in token");
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log(
        `📊 Fetching contact stats for user ${userId}, period: ${period}`
      );

      // Debug: Check all contacts in database first
      const allContacts = await Contact.find({}).limit(5).lean();
      console.log(
        `🗄️ Total contacts in database:`,
        await Contact.countDocuments()
      );
      if (allContacts.length > 0) {
        console.log(`📝 Sample contact from DB:`, {
          id: allContacts[0]._id,
          receiverId: allContacts[0].receiverId,
          senderId: allContacts[0].senderId,
          receiverIdType: typeof allContacts[0].receiverId,
          senderIdType: typeof allContacts[0].senderId,
          createdAt: allContacts[0].createdAt,
        });
        console.log(
          `🔍 Looking for userId: ${userId} (type: ${typeof userId})`
        );
      }

      // Debug: Check all contacts for this user (both sent and received)
      const allUserContacts = await Contact.find({
        $or: [{ receiverId: userId }, { senderId: userId }],
      }).lean();
      console.log(
        `📞 All contacts for user ${userId} (sent + received):`,
        allUserContacts.length
      );

      const receivedContacts = await Contact.find({
        receiverId: userId,
      }).lean();
      console.log(
        `📞 Received contacts for user ${userId}:`,
        receivedContacts.length
      );

      if (allUserContacts.length > 0) {
        console.log(`📝 Sample contact:`, {
          id: allUserContacts[0]._id,
          receiverId: allUserContacts[0].receiverId,
          senderId: allUserContacts[0].senderId,
          createdAt: allUserContacts[0].createdAt,
          message: allUserContacts[0].message.substring(0, 50) + "...",
        });
      }

      let data: ContactRequestData[] = [];
      const now = new Date();

      switch (period) {
        case "weekly":
          // Get data for last 7 days (day by day)
          for (let i = 6; i >= 0; i--) {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            // Query real contact data for this day
            const count = await Contact.countDocuments({
              receiverId: userId,
              createdAt: {
                $gte: dayStart,
                $lte: dayEnd,
              },
            });

            // Format day label
            const dayLabel = `${dayStart.getDate()}/${dayStart.getMonth() + 1}`;

            console.log(`📈 Ngày ${dayLabel}: ${count} contacts`);

            data.push({
              period: dayLabel,
              count,
            });
          }
          break;

        case "monthly":
          // Get data for last 6 months
          for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(
              now.getFullYear(),
              now.getMonth() - i,
              1
            );
            const monthEnd = new Date(
              now.getFullYear(),
              now.getMonth() - i + 1,
              0
            );
            monthEnd.setHours(23, 59, 59, 999);

            // Query real contact data
            const count = await Contact.countDocuments({
              receiverId: userId,
              createdAt: {
                $gte: monthStart,
                $lte: monthEnd,
              },
            });

            console.log(
              `📈 Month ${monthStart.getMonth() + 1}: ${count} contacts`
            );

            const monthNames = [
              "Tháng 1",
              "Tháng 2",
              "Tháng 3",
              "Tháng 4",
              "Tháng 5",
              "Tháng 6",
              "Tháng 7",
              "Tháng 8",
              "Tháng 9",
              "Tháng 10",
              "Tháng 11",
              "Tháng 12",
            ];

            data.push({
              period: monthNames[monthStart.getMonth()],
              count,
            });
          }
          break;

        case "yearly":
          // Get data for last 4 years
          for (let i = 3; i >= 0; i--) {
            const yearStart = new Date(now.getFullYear() - i, 0, 1);
            const yearEnd = new Date(now.getFullYear() - i, 11, 31);
            yearEnd.setHours(23, 59, 59, 999);

            // Query real contact data
            const count = await Contact.countDocuments({
              receiverId: userId,
              createdAt: {
                $gte: yearStart,
                $lte: yearEnd,
              },
            });

            console.log(`📈 Year ${now.getFullYear() - i}: ${count} contacts`);

            data.push({
              period: (now.getFullYear() - i).toString(),
              count,
            });
          }
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid period. Use weekly, monthly, or yearly",
          });
      }

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      console.error("Error getting contact request stats:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get top posts by views for current user
  static async getTopPostsByViews(req: AuthenticatedRequest, res: Response) {
    console.log("🔍 Dashboard Controller - getTopPostsByViews called");
    console.log("User from token:", req.user);
    console.log("Query params:", req.query);

    try {
      const userId = req.user?.userId;
      const { limit = 5 } = req.query;

      if (!userId) {
        console.log("❌ No userId found in token");
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      console.log(`📊 Fetching top posts for user ${userId}, limit: ${limit}`);

      const topPosts = await Post.find({
        author: userId,
        status: "approved",
      })
        .select("_id title views createdAt")
        .sort({ views: -1 })
        .limit(parseInt(limit as string))
        .lean();

      const formattedPosts = topPosts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        views: post.views || 0,
        createdAt: post.createdAt,
      }));

      res.json({
        success: true,
        data: formattedPosts,
      });
    } catch (error) {
      console.error("Error getting top posts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get dashboard data for admin/employee
  static async getAdminDashboardData(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;

      if (!userRole || !["admin", "employee"].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get contact requests for all users
      const contactData: {
        weekly: ContactRequestData[];
        monthly: ContactRequestData[];
        yearly: ContactRequestData[];
      } = {
        weekly: [],
        monthly: [],
        yearly: [],
      };

      // Weekly data for admin
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7 - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // Mock data for admin
        const count = Math.floor(Math.random() * 50) + 20; // Mock data 20-70

        contactData.weekly.push({
          period: `Tuần ${7 - i}`,
          count,
        });
      }

      // Monthly data for admin
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        // Mock data for admin
        const count = Math.floor(Math.random() * 200) + 100; // Mock data 100-300

        const monthNames = [
          "Tháng 1",
          "Tháng 2",
          "Tháng 3",
          "Tháng 4",
          "Tháng 5",
          "Tháng 6",
          "Tháng 7",
          "Tháng 8",
          "Tháng 9",
          "Tháng 10",
          "Tháng 11",
          "Tháng 12",
        ];

        contactData.monthly.push({
          period: monthNames[monthStart.getMonth()],
          count,
        });
      }

      // Yearly data for admin
      for (let i = 3; i >= 0; i--) {
        const yearStart = new Date(now.getFullYear() - i, 0, 1);
        const yearEnd = new Date(now.getFullYear() - i, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);

        // Mock data for admin
        const count = Math.floor(Math.random() * 2000) + 1000; // Mock data 1000-3000

        contactData.yearly.push({
          period: (now.getFullYear() - i).toString(),
          count,
        });
      }

      // Get top posts across all users
      const topPosts = await Post.find({ status: "approved" })
        .select("_id title views createdAt author")
        .populate("author", "fullName")
        .sort({ views: -1 })
        .limit(5)
        .lean();

      const formattedTopPosts = topPosts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        views: post.views || 0,
        createdAt: post.createdAt,
        authorName: (post.author as any)?.fullName || "Unknown",
      }));

      res.json({
        success: true,
        data: {
          contactRequests: contactData,
          topPosts: formattedTopPosts,
        },
      });
    } catch (error) {
      console.error("Error getting admin dashboard data:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
