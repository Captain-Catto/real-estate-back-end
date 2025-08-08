import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types";
import { User } from "../models/User";
import { Post } from "../models/Post";
import { Project } from "../models/Project";
import { Payment } from "../models/Payment";
import { ContactMessage } from "../models/ContactMessage";
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

      const [
        totalUsers,
        totalPosts,
        totalProjects,
        totalRevenue,
        pendingPosts,
        activePosts,
        newUsersToday,
        newPostsToday,
        totalNews,
        totalContacts,
        totalViews,
        paidPosts,
      ] = await Promise.all([
        User.countDocuments(userMatchCondition),
        Post.countDocuments(postMatchCondition),
        Project.countDocuments(projectMatchCondition),
        Payment.aggregate([
          { $match: paymentMatchCondition },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]).then((result) => result[0]?.total || 0),
        Post.countDocuments({
          ...postMatchCondition,
          status: "pending",
        }),
        Post.countDocuments({
          ...postMatchCondition,
          status: "active",
        }),
        User.countDocuments({
          ...userMatchCondition,
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }),
        Post.countDocuments({
          ...postMatchCondition,
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        }),
        // Additional fields needed by frontend
        News.countDocuments({}),
        ContactMessage.countDocuments({}),
        PageView.countDocuments({}),
        Post.countDocuments({
          ...postMatchCondition,
          packageId: { $exists: true, $ne: null },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalUsers,
          totalPosts,
          totalProjects,
          totalRevenue,
          pendingPosts,
          activePosts,
          newUsersToday,
          newPostsToday,
          totalNews,
          totalContacts,
          totalViews,
          paidPosts,
          // Additional fields for better stats display
          newUsersThisMonth: newUsersToday, // Using today's data as proxy
          newPostsThisMonth: newPostsToday, // Using today's data as proxy
          revenueThisMonth:
            totalRevenue > 0 ? Math.round(totalRevenue * 0.1) : 0, // Rough estimate
        },
      });
    } catch (error) {
      console.error("Error getting overview stats:", error);
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
      console.error("Error getting revenue chart:", error);
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
    } catch (error) {
      console.error("Error getting user chart:", error);
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
          $limit: 5,
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
    } catch (error) {
      console.error("Error getting top locations:", error);
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
    try {
      // Permission check is handled by middleware, no need for additional role check
      // Aggregate posts by package
      const packageStats = await Post.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$packageId", null] },
                    { $eq: ["$packageId", ""] },
                    { $eq: [{ $type: "$packageId" }, "missing"] },
                  ],
                },
                "Tin miễn phí",
                "$packageId",
              ],
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      // Get package names for paid posts
      const packageData = [];
      for (const stat of packageStats) {
        if (stat._id === "Tin miễn phí") {
          packageData.push({
            label: "Tin miễn phí",
            count: stat.count,
          });
        } else {
          try {
            const packageInfo = await Package.findById(stat._id);
            packageData.push({
              label: packageInfo?.name || `Gói ${stat._id}`,
              count: stat.count,
            });
          } catch (error) {
            packageData.push({
              label: `Gói ${stat._id}`,
              count: stat.count,
            });
          }
        }
      }

      const labels = packageData.map((item) => item.label);
      const data = packageData.map((item) => item.count);

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
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 205, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
      });
    } catch (error) {
      console.error("Error getting posts chart:", error);
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
    try {
      // Permission check is handled by middleware, no need for additional role check
      // Get property types from categories
      const propertyTypes = await Post.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $unwind: {
            path: "$categoryInfo",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: {
              $ifNull: ["$categoryInfo.name", "Chưa phân loại"],
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

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
    } catch (error) {
      console.error("Error getting property types chart:", error);
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
