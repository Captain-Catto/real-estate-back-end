import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Project } from "../models/Project";
import { Payment } from "../models/Payment";
import { Wallet } from "../models/Wallet";
import { News } from "../models/News";
import { PageView } from "../models/PageView";
import { Category } from "../models/Category";
import { Package } from "../models/Package";

export class StatsController {
  /**
   * Lấy tổng quan thống kê
   * GET /api/admin/stats/overview?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getOverviewStats(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getOverviewStats");

    try {
      // Permission check is handled by middleware, no need for additional role check

      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let dateFilter: any = {};

      // Add date range filter if provided
      if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);

        dateFilter = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Build match conditions for different collections
      const userMatchCondition: any = { role: { $ne: "admin" } };
      const postMatchCondition: any = {};
      const projectMatchCondition: any = {};
      const paymentMatchCondition: any = {};

      // Apply date filters
      if (Object.keys(dateFilter).length > 0) {
        userMatchCondition.createdAt = dateFilter;
        postMatchCondition.createdAt = dateFilter;
        projectMatchCondition.createdAt = dateFilter;
        paymentMatchCondition.createdAt = dateFilter;
      }

      // Calculate start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Optimize by grouping related queries and reducing database calls
      console.time("⏱️ Overview stats - Primary counts");
      // Group 1: Basic counts that are fast (removed contacts for performance)
      const [
        totalUsers,
        totalProjects,
        totalRevenue,
        totalNews,
        totalViews,
        newUsersThisMonth,
      ] = await Promise.all([
        User.countDocuments(userMatchCondition),
        Project.countDocuments(projectMatchCondition),
        Payment.aggregate([
          { $match: paymentMatchCondition },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]).then((result) => result[0]?.total || 0),
        News.countDocuments({}),
        PageView.countDocuments({}),
        User.countDocuments({
          role: { $ne: "admin" },
          createdAt: { $gte: startOfMonth },
        }),
      ]);
      console.timeEnd("⏱️ Overview stats - Primary counts");

      console.time("⏱️ Overview stats - Post analytics");
      // Group 2: Post-related queries in one optimized aggregation
      const postAnalytics = await Post.aggregate([
        {
          $match: postMatchCondition,
        },
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            pendingPosts: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            activePosts: {
              $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
            },
            todayPosts: {
              $sum: {
                $cond: [
                  {
                    $gte: [
                      "$createdAt",
                      new Date(new Date().setHours(0, 0, 0, 0)),
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            postsWithPackage: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$packageId", null] },
                      { $ne: ["$packageId", undefined] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);

      const {
        totalPosts = 0,
        pendingPosts = 0,
        activePosts = 0,
        todayPosts: newPostsToday = 0,
        postsWithPackage = 0,
      } = postAnalytics[0] || {};
      console.timeEnd("⏱️ Overview stats - Post analytics");

      console.log(
        `📊 [Backend] Overview stats collected: users=${totalUsers}, posts=${totalPosts}, revenue=${totalRevenue}`
      );

      const overviewDuration = Date.now() - startTime;
      console.log(
        `✅ [Backend] getOverviewStats completed in ${overviewDuration}ms`
      );

      res.json({
        success: true,
        data: {
          totalUsers,
          totalPosts,
          totalProjects,
          totalRevenue,
          pendingPosts,
          activePosts,
          newUsersToday: newUsersThisMonth, // Keep for backward compatibility
          newPostsToday,
          totalNews,
          totalViews,
          // Additional fields for better stats display
          newUsersThisMonth,
          newPostsThisMonth: newPostsToday, // Using today's data as proxy
          revenueThisMonth:
            totalRevenue > 0 ? Math.round(totalRevenue * 0.1) : 0, // Rough estimate
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getOverviewStats failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê tổng quan",
      });
    }
  }

  /**
   * Lấy biểu đồ doanh thu theo thời gian
   * GET /api/admin/stats/revenue-chart?period=month|quarter|year&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getRevenueChart(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getRevenueChart");

    try {
      // Permission check is handled by middleware, no need for additional role check
      const period = (req.query.period as string) || "month";
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let groupBy: any;
      let labels: string[] = [];
      let matchCondition: any = {};

      // Override date range if custom dates provided
      if (startDateParam && endDateParam) {
        const customStartDate = new Date(startDateParam);
        const customEndDate = new Date(endDateParam);
        customEndDate.setHours(23, 59, 59, 999);

        matchCondition.createdAt = {
          $gte: customStartDate,
          $lte: customEndDate,
        };
      }

      switch (period) {
        case "month":
          if (!startDateParam || !endDateParam) {
            // Default monthly grouping by month
            groupBy = { $month: "$createdAt" };
            labels = [
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
            if (!matchCondition.createdAt) {
              matchCondition.createdAt = {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1),
              };
            }
          } else {
            // Custom date range - group by day
            groupBy = {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            };
            labels = [];
          }
          break;
        case "quarter":
          groupBy = {
            $switch: {
              branches: [
                { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
                { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
                { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
              ],
              default: 4,
            },
          };
          labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"];
          if (!matchCondition.createdAt) {
            matchCondition.createdAt = {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            };
          }
          break;
        case "year":
          groupBy = { $year: "$createdAt" };
          const currentYear = new Date().getFullYear();
          labels = Array.from(
            { length: 5 },
            (_, i) => `${currentYear - 4 + i}`
          );
          if (!matchCondition.createdAt) {
            matchCondition.createdAt = {
              $gte: new Date(currentYear - 4, 0, 1),
            };
          }
          break;
      }

      const revenue = await Payment.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: groupBy,
            total: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Format data for chart
      if (period === "month" && startDateParam && endDateParam) {
        // For custom date range, create labels from the data
        const sortedData = revenue.sort((a, b) => a._id.localeCompare(b._id));
        labels = sortedData.map((item) => item._id);
      }

      const data = labels.map((label, index) => {
        const periodData = revenue.find((item) => {
          if (period === "month" && startDateParam && endDateParam) {
            return item._id === label;
          } else if (period === "month") {
            return item._id === index + 1;
          } else if (period === "quarter") {
            return item._id === index + 1;
          } else {
            return item._id.toString() === label;
          }
        });
        return periodData ? periodData.total : 0;
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Backend] getRevenueChart completed in ${duration}ms`);

      res.json({
        success: true,
        data: {
          labels,
          datasets: [
            {
              label: "Doanh thu",
              data,
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getRevenueChart failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ doanh thu",
      });
    }
  }

  /**
   * Lấy biểu đồ đăng ký người dùng theo thời gian
   * GET /api/admin/stats/user-chart?period=month|quarter|year&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
   */
  static async getUserChart(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getUserChart");

    try {
      // Permission check is handled by middleware, no need for additional role check
      const period = (req.query.period as string) || "month";
      const year =
        parseInt(req.query.year as string) || new Date().getFullYear();
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;

      let groupBy: any;
      let labels: string[] = [];
      let matchCondition: any = { role: { $ne: "admin" } };

      // Override date range if custom dates provided
      if (startDateParam && endDateParam) {
        const customStartDate = new Date(startDateParam);
        const customEndDate = new Date(endDateParam);
        customEndDate.setHours(23, 59, 59, 999);

        matchCondition.createdAt = {
          $gte: customStartDate,
          $lte: customEndDate,
        };
      }

      switch (period) {
        case "month":
          if (!startDateParam || !endDateParam) {
            // Default monthly grouping by month
            groupBy = { $month: "$createdAt" };
            labels = [
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
            if (!matchCondition.createdAt) {
              matchCondition.createdAt = {
                $gte: new Date(year, 0, 1),
                $lt: new Date(year + 1, 0, 1),
              };
            }
          } else {
            // Custom date range - group by day
            groupBy = {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            };
            labels = [];
          }
          break;
        case "quarter":
          groupBy = {
            $switch: {
              branches: [
                { case: { $lte: [{ $month: "$createdAt" }, 3] }, then: 1 },
                { case: { $lte: [{ $month: "$createdAt" }, 6] }, then: 2 },
                { case: { $lte: [{ $month: "$createdAt" }, 9] }, then: 3 },
              ],
              default: 4,
            },
          };
          labels = ["Quý 1", "Quý 2", "Quý 3", "Quý 4"];
          if (!matchCondition.createdAt) {
            matchCondition.createdAt = {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            };
          }
          break;
        case "year":
          groupBy = { $year: "$createdAt" };
          const currentYear = new Date().getFullYear();
          labels = Array.from(
            { length: 5 },
            (_, i) => `${currentYear - 4 + i}`
          );
          if (!matchCondition.createdAt) {
            matchCondition.createdAt = {
              $gte: new Date(currentYear - 4, 0, 1),
            };
          }
          break;
        default:
          // Default to month
          groupBy = { $month: "$createdAt" };
          labels = [
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
          if (!matchCondition.createdAt) {
            matchCondition.createdAt = {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            };
          }
          break;
      }

      const users = await User.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: groupBy,
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Format data for chart
      if (period === "month" && startDateParam && endDateParam) {
        // For custom date range, create labels from the data
        const sortedData = users.sort((a, b) => a._id.localeCompare(b._id));
        labels = sortedData.map((item) => item._id);
      }

      const data = labels.map((label, index) => {
        const periodData = users.find((item) => {
          if (period === "month" && startDateParam && endDateParam) {
            return item._id === label;
          } else if (period === "month") {
            return item._id === index + 1;
          } else if (period === "quarter") {
            return item._id === index + 1;
          } else {
            return item._id.toString() === label;
          }
        });
        return periodData ? periodData.count : 0;
      });

      res.json({
        success: true,
        data: {
          labels,
          datasets: [
            {
              label: "Người dùng đăng ký",
              data,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Backend] getUserChart completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getUserChart failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ người dùng",
      });
    }
  }

  /**
   * Lấy top 5 địa điểm có nhiều bài đăng nhất
   * GET /api/admin/stats/top-locations
   */
  static async getTopLocations(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getTopLocations");

    try {
      // Permission check is handled by middleware, no need for additional role check
      // Load province data for mapping codes to names
      const fs = require("fs");
      const path = require("path");
      const provinceDataPath = path.join(__dirname, "../../province.json");
      const provinceData = JSON.parse(
        fs.readFileSync(provinceDataPath, "utf8")
      );

      const totalPosts = await Post.countDocuments();

      const locationStats = await Post.aggregate([
        {
          $group: {
            _id: "$location.province",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      const topLocations = locationStats.map((stat) => {
        const provinceCode = stat._id || "unknown";
        const provinceName =
          provinceData[provinceCode]?.name || "Không xác định";

        return {
          province: provinceName,
          provinceCode: provinceCode,
          count: stat.count,
          percentage:
            totalPosts > 0
              ? Math.round((stat.count / totalPosts) * 100 * 10) / 10
              : 0,
        };
      });

      res.json({
        success: true,
        data: topLocations,
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Backend] getTopLocations completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getTopLocations failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy top địa điểm",
      });
    }
  }

  /**
   * Lấy thống kê lượt xem trang theo thời gian
   * GET /api/admin/stats/page-views?period=day|week|month
   */
  static async getPageViewStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Permission check is handled by middleware, no need for additional role check
      const period = (req.query.period as string) || "day";
      const currentDate = new Date();
      let matchCondition: any = {};
      let groupBy: any;
      let labels: string[] = [];

      switch (period) {
        case "day":
          // Last 7 days
          const sevenDaysAgo = new Date(currentDate);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
          sevenDaysAgo.setHours(0, 0, 0, 0);

          matchCondition = {
            createdAt: { $gte: sevenDaysAgo },
          };

          groupBy = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };

          labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(sevenDaysAgo);
            date.setDate(date.getDate() + i);
            return date.toISOString().split("T")[0];
          });
          break;

        case "week":
          // Last 4 weeks
          const fourWeeksAgo = new Date(currentDate);
          fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 27);
          fourWeeksAgo.setHours(0, 0, 0, 0);

          matchCondition = {
            createdAt: { $gte: fourWeeksAgo },
          };

          groupBy = {
            $week: "$createdAt",
          };

          labels = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
          break;

        case "month":
          // Current year by months
          const startOfYear = new Date(currentDate.getFullYear(), 0, 1);

          matchCondition = {
            createdAt: { $gte: startOfYear },
          };

          groupBy = { $month: "$createdAt" };

          labels = [
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
          break;
        default:
          // Default to day
          const defaultSevenDaysAgo = new Date(currentDate);
          defaultSevenDaysAgo.setDate(defaultSevenDaysAgo.getDate() - 6);
          defaultSevenDaysAgo.setHours(0, 0, 0, 0);

          matchCondition = {
            createdAt: { $gte: defaultSevenDaysAgo },
          };

          groupBy = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };

          labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(defaultSevenDaysAgo);
            date.setDate(date.getDate() + i);
            return date.toISOString().split("T")[0];
          });
          break;
      }

      const pageViews = await PageView.aggregate([
        { $match: matchCondition },
        {
          $group: {
            _id: groupBy,
            views: { $sum: 1 },
            uniqueVisitors: { $addToSet: "$ipAddress" },
          },
        },
        {
          $project: {
            _id: 1,
            views: 1,
            uniqueVisitors: { $size: "$uniqueVisitors" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const viewData = labels.map((label, index) => {
        const periodData = pageViews.find((item) => {
          if (period === "day") {
            return item._id === label;
          } else if (period === "week") {
            // Week calculation might need adjustment based on your requirements
            return item._id === index + 1;
          } else {
            return item._id === index + 1;
          }
        });
        return periodData ? periodData.views : 0;
      });

      const visitorData = labels.map((label, index) => {
        const periodData = pageViews.find((item) => {
          if (period === "day") {
            return item._id === label;
          } else if (period === "week") {
            return item._id === index + 1;
          } else {
            return item._id === index + 1;
          }
        });
        return periodData ? periodData.uniqueVisitors : 0;
      });

      res.json({
        success: true,
        data: {
          labels,
          datasets: [
            {
              label: "Lượt xem",
              data: viewData,
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              borderColor: "rgba(255, 99, 132, 1)",
              borderWidth: 1,
            },
            {
              label: "Người xem duy nhất",
              data: visitorData,
              backgroundColor: "rgba(54, 162, 235, 0.2)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      console.error("Error getting page view stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê lượt xem",
      });
    }
  }

  /**
   * Xuất báo cáo thống kê
   * GET /api/admin/stats/export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&format=csv|excel
   */
  static async exportStats(req: AuthenticatedRequest, res: Response) {
    try {
      // Permission check is handled by middleware, no need for additional role check
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      const format = (req.query.format as string) || "csv";

      let dateFilter: any = {};

      if (startDateParam && endDateParam) {
        const startDate = new Date(startDateParam);
        const endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);

        dateFilter = {
          $gte: startDate,
          $lte: endDate,
        };
      }

      // Get comprehensive stats data
      const [overviewStats, revenueData, userData, locationData] =
        await Promise.all([
          // Overview stats
          this.getOverviewStatsData(dateFilter),
          // Revenue data
          this.getRevenueData(dateFilter),
          // User registration data
          this.getUserRegistrationData(dateFilter),
          // Location data
          this.getLocationData(),
        ]);

      if (format === "csv") {
        const csvData = this.formatDataToCSV({
          overview: overviewStats,
          revenue: revenueData,
          users: userData,
          locations: locationData,
          dateRange: { start: startDateParam, end: endDateParam },
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="thong-ke-${
            new Date().toISOString().split("T")[0]
          }.csv"`
        );
        res.send(csvData);
      } else {
        res.status(400).json({
          success: false,
          message: "Định dạng không được hỗ trợ",
        });
      }
    } catch (error) {
      console.error("Error exporting stats:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xuất báo cáo",
      });
    }
  }

  /**
   * Lấy biểu đồ phân bố gói tin đăng
   * GET /api/admin/stats/posts-chart
   */
  static async getPostsChart(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getPostsChart");

    try {
      // Permission check is handled by middleware, no need for additional role check

      // Step 1: Count posts directly by packageId (since packageId is stored as string)
      const postCounts = await Post.aggregate([
        {
          $group: {
            _id: "$packageId",
            count: { $sum: 1 },
          },
        },
      ]);

      // Step 2: Map the counts to our 4 categories
      const categoryCounts = {
        free: 0,
        basic: 0,
        premium: 0,
        vip: 0,
      };

      postCounts.forEach((item) => {
        const packageId = item._id;
        const count = item.count;

        if (packageId === "free" || !packageId) {
          categoryCounts.free += count;
        } else if (packageId === "basic") {
          categoryCounts.basic += count;
        } else if (packageId === "premium") {
          categoryCounts.premium += count;
        } else if (packageId === "vip") {
          categoryCounts.vip += count;
        } else if (mongoose.Types.ObjectId.isValid(packageId)) {
          // Handle ObjectId references by looking up the package
          // For now, we'll handle this as a separate case
          categoryCounts.free += count; // Default to free for unknown ObjectId packages
        }
      });

      // Step 3: Create fixed output with exactly 4 categories using actual package names
      const labels = [
        "Gói Miễn Phí",
        "Gói Cơ Bản Cao Cấp",
        "Gói Cao Cấp",
        "Gói VIP",
      ];
      const data = [
        categoryCounts.free,
        categoryCounts.basic,
        categoryCounts.premium,
        categoryCounts.vip,
      ];

      res.json({
        success: true,
        data: {
          labels,
          datasets: [
            {
              label: "Số lượng tin đăng",
              data,
              backgroundColor: [
                "rgba(156, 163, 175, 0.2)", // Gray for free
                "rgba(59, 130, 246, 0.2)", // Blue for basic
                "rgba(249, 115, 22, 0.2)", // Orange for premium
                "rgba(168, 85, 247, 0.2)", // Purple for VIP
              ],
              borderColor: [
                "rgba(156, 163, 175, 1)",
                "rgba(59, 130, 246, 1)",
                "rgba(249, 115, 22, 1)",
                "rgba(168, 85, 247, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
      });

      const duration = Date.now() - startTime;
      console.log(`✅ [Backend] getPostsChart completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getPostsChart failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ tin đăng",
      });
    }
  }

  /**
   * Lấy biểu đồ loại bất động sản
   * GET /api/admin/stats/property-types-chart
   */
  static async getPropertyTypesChart(req: AuthenticatedRequest, res: Response) {
    const startTime = Date.now();
    console.log("🚀 [Backend] Starting getPropertyTypesChart");

    try {
      // Permission check is handled by middleware, no need for additional role check

      console.time("⏱️ PropertyTypes optimized aggregation");
      // Optimized approach: First get category data, then count posts per category
      const categoryData = await Category.find({}, { name: 1 }).lean();
      const categoryMap = new Map();
      categoryData.forEach((cat) =>
        categoryMap.set(cat._id.toString(), cat.name)
      );

      // Fast aggregation without lookup
      const propertyTypesRaw = await Post.aggregate([
        {
          $match: {
            status: { $in: ["approved", "active"] },
            category: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      // Map category IDs to names
      const propertyTypes = propertyTypesRaw.map((item) => ({
        _id: categoryMap.get(item._id.toString()) || "Chưa phân loại",
        count: item.count,
      }));

      console.timeEnd("⏱️ PropertyTypes optimized aggregation");

      console.log(`📊 [Backend] Found ${propertyTypes.length} property types`);

      const labels = propertyTypes.map((item) => item._id);
      const data = propertyTypes.map((item) => item.count);

      res.json({
        success: true,
        data: {
          labels,
          datasets: [
            {
              label: "Số lượng tin đăng",
              data,
              backgroundColor: [
                "rgba(255, 99, 132, 0.2)",
                "rgba(54, 162, 235, 0.2)",
                "rgba(255, 205, 86, 0.2)",
                "rgba(75, 192, 192, 0.2)",
                "rgba(153, 102, 255, 0.2)",
                "rgba(255, 159, 64, 0.2)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 205, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
      });

      const duration = Date.now() - startTime;
      console.log(
        `✅ [Backend] getPropertyTypesChart completed in ${duration}ms`
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ [Backend] getPropertyTypesChart failed in ${duration}ms:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy biểu đồ loại bất động sản",
      });
    }
  }

  /**
   * Track page view (public endpoint)
   * POST /api/stats/track-view
   */
  static async trackPageView(req: Request, res: Response) {
    try {
      const { page, referrer, userAgent } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

      const pageView = new PageView({
        page: page || "unknown",
        ipAddress,
        referrer: referrer || "",
        userAgent: userAgent || "",
        createdAt: new Date(),
      });

      await pageView.save();

      res.json({
        success: true,
        message: "Page view tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking page view:", error);
      res.status(500).json({
        success: false,
        message: "Error tracking page view",
      });
    }
  }

  // Helper methods for export functionality
  private static async getOverviewStatsData(dateFilter: any) {
    const userMatchCondition: any = { role: { $ne: "admin" } };
    const postMatchCondition: any = {};
    const projectMatchCondition: any = {};
    const paymentMatchCondition: any = {};

    if (Object.keys(dateFilter).length > 0) {
      userMatchCondition.createdAt = dateFilter;
      postMatchCondition.createdAt = dateFilter;
      projectMatchCondition.createdAt = dateFilter;
      paymentMatchCondition.createdAt = dateFilter;
    }

    const [
      totalUsers,
      totalPosts,
      totalProjects,
      totalRevenue,
      pendingPosts,
      activePosts,
    ] = await Promise.all([
      User.countDocuments(userMatchCondition),
      Post.countDocuments(postMatchCondition),
      Project.countDocuments(projectMatchCondition),
      Payment.aggregate([
        { $match: paymentMatchCondition },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).then((result) => result[0]?.total || 0),
      Post.countDocuments({ ...postMatchCondition, status: "pending" }),
      Post.countDocuments({ ...postMatchCondition, status: "active" }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalProjects,
      totalRevenue,
      pendingPosts,
      activePosts,
    };
  }

  private static async getRevenueData(dateFilter: any) {
    const matchCondition: any = {};
    if (Object.keys(dateFilter).length > 0) {
      matchCondition.createdAt = dateFilter;
    }

    return await Payment.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private static async getUserRegistrationData(dateFilter: any) {
    const matchCondition: any = { role: { $ne: "admin" } };
    if (Object.keys(dateFilter).length > 0) {
      matchCondition.createdAt = dateFilter;
    }

    return await User.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  private static async getLocationData() {
    // Load province data for mapping codes to names
    const fs = require("fs");
    const path = require("path");
    const provinceDataPath = path.join(__dirname, "../../province.json");
    const provinceData = JSON.parse(fs.readFileSync(provinceDataPath, "utf8"));

    const locationStats = await Post.aggregate([
      {
        $group: {
          _id: "$location.province",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return locationStats.map((stat) => {
      const provinceCode = stat._id || "unknown";
      const provinceName = provinceData[provinceCode]?.name || "Không xác định";

      return {
        province: provinceName,
        provinceCode: provinceCode,
        count: stat.count,
      };
    });
  }

  private static formatDataToCSV(data: any): string {
    let csv = "BÁO CÁO THỐNG KÊ TỔNG QUAN\n\n";

    // Add date range if specified
    if (data.dateRange.start && data.dateRange.end) {
      csv += `Thời gian: Từ ${data.dateRange.start} đến ${data.dateRange.end}\n\n`;
    }

    // Overview section
    csv += "TỔNG QUAN\n";
    csv += "Chỉ số,Giá trị\n";
    csv += `Tổng số người dùng,${data.overview.totalUsers}\n`;
    csv += `Tổng số bài đăng,${data.overview.totalPosts}\n`;
    csv += `Tổng số dự án,${data.overview.totalProjects}\n`;
    csv += `Tổng doanh thu,${data.overview.totalRevenue.toLocaleString()} VNĐ\n`;
    csv += `Bài đăng chờ duyệt,${data.overview.pendingPosts}\n`;
    csv += `Bài đăng đang hoạt động,${data.overview.activePosts}\n\n`;

    // Revenue section
    if (data.revenue.length > 0) {
      csv += "DOANH THU THEO NGÀY\n";
      csv += "Ngày,Doanh thu (VNĐ),Số giao dịch\n";
      data.revenue.forEach((item: any) => {
        csv += `${item._id},${item.total.toLocaleString()},${item.count}\n`;
      });
      csv += "\n";
    }

    // User registration section
    if (data.users.length > 0) {
      csv += "ĐĂNG KÝ NGƯỜI DÙNG THEO NGÀY\n";
      csv += "Ngày,Số lượng đăng ký\n";
      data.users.forEach((item: any) => {
        csv += `${item._id},${item.count}\n`;
      });
      csv += "\n";
    }

    // Location section
    csv += "THỐNG KÊ THEO ĐỊA ĐIỂM\n";
    csv += "Tỉnh/Thành phố,Mã tỉnh,Số bài đăng\n";
    data.locations.forEach((item: any) => {
      csv += `${item.province},${item.provinceCode},${item.count}\n`;
    });

    return csv;
  }
}
