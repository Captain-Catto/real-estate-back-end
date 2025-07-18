import { Request, Response } from "express";
import { SidebarConfig, ISidebarMenuItem } from "../models/SidebarConfig";
import { AuthenticatedRequest } from "../middleware";

// Default sidebar menu items
const defaultAdminMenuItems: ISidebarMenuItem[] = [
  {
    id: "overview",
    name: "Tổng quan",
    href: "/admin",
    icon: "HomeIcon",
    order: 1,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-posts",
    name: "Quản lý tin đăng",
    href: "/admin/quan-ly-tin-dang",
    icon: "DocumentTextIcon",
    order: 2,
    isVisible: true,
    roles: ["admin", "employee"],
  },
  {
    id: "manage-users",
    name: "Quản lý người dùng",
    href: "/admin/quan-ly-nguoi-dung",
    icon: "UserGroupIcon",
    order: 3,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-news",
    name: "Tin tức",
    href: "/admin/quan-ly-tin-tuc",
    icon: "NewspaperIcon",
    order: 4,
    isVisible: true,
    roles: ["admin", "employee"],
  },
  {
    id: "manage-transactions",
    name: "Giao dịch",
    href: "/admin/quan-ly-giao-dich",
    icon: "CurrencyDollarIcon",
    order: 5,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "statistics",
    name: "Thống kê",
    href: "/admin/thong-ke",
    icon: "ChartBarIcon",
    order: 6,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-locations",
    name: "Quản lý địa chính",
    href: "/admin/quan-ly-dia-chinh",
    icon: "MapIcon",
    order: 7,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-projects",
    name: "Quản lý dự án",
    href: "/admin/quan-ly-du-an",
    icon: "BuildingOfficeIcon",
    order: 8,
    isVisible: true,
    roles: ["admin", "employee"],
  },
  {
    id: "manage-developers",
    name: "Quản lý chủ đầu tư",
    href: "/admin/quan-ly-chu-dau-tu",
    icon: "UserGroupIcon",
    order: 9,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-categories",
    name: "Quản lý danh mục",
    href: "/admin/quan-ly-danh-muc",
    icon: "DocumentTextIcon",
    order: 10,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-areas",
    name: "Quản lý diện tích",
    href: "/admin/quan-ly-dien-tich",
    icon: "DocumentTextIcon",
    order: 11,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "manage-prices",
    name: "Quản lý giá",
    href: "/admin/quan-ly-gia",
    icon: "DocumentTextIcon",
    order: 12,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "settings",
    name: "Cài đặt",
    href: "/admin/cai-dat",
    icon: "CogIcon",
    order: 13,
    isVisible: true,
    roles: ["admin"],
  },
  {
    id: "sidebar-config",
    name: "Cấu hình Sidebar",
    href: "/admin/cau-hinh-sidebar",
    icon: "CogIcon",
    order: 14,
    isVisible: true,
    roles: ["admin"],
  },
];

const defaultEmployeeMenuItems: ISidebarMenuItem[] = [
  {
    id: "overview",
    name: "Tổng quan",
    href: "/employee",
    icon: "HomeIcon",
    order: 1,
    isVisible: true,
    roles: ["employee"],
  },
  {
    id: "manage-posts",
    name: "Quản lý tin đăng",
    href: "/employee/quan-ly-tin-dang",
    icon: "DocumentTextIcon",
    order: 2,
    isVisible: true,
    roles: ["employee"],
  },
  {
    id: "manage-news",
    name: "Tin tức",
    href: "/employee/quan-ly-tin-tuc",
    icon: "NewspaperIcon",
    order: 3,
    isVisible: true,
    roles: ["employee"],
  },
  {
    id: "manage-projects",
    name: "Quản lý dự án",
    href: "/employee/quan-ly-du-an",
    icon: "BuildingOfficeIcon",
    order: 4,
    isVisible: true,
    roles: ["employee"],
  },
];

export class SidebarConfigController {
  // GET /api/admin/sidebar-config - Lấy cấu hình sidebar
  async getSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Tìm cấu hình cá nhân của user trước
      let config = await SidebarConfig.findOne({
        userId: userId,
        role: userRole,
      });

      // Nếu không có cấu hình cá nhân, tìm cấu hình mặc định cho role
      if (!config) {
        config = await SidebarConfig.findOne({
          isDefault: true,
          role: userRole,
        });
      }

      // Nếu vẫn không có, tạo cấu hình mặc định
      if (!config) {
        const defaultItems =
          userRole === "admin"
            ? defaultAdminMenuItems
            : defaultEmployeeMenuItems;

        config = new SidebarConfig({
          userId: null, // Default config
          menuItems: defaultItems,
          isDefault: true,
          role: userRole,
        });

        await config.save();
      }

      res.json({
        success: true,
        data: {
          menuItems: config.menuItems,
          role: config.role,
          isDefault: config.isDefault,
        },
      });
    } catch (error) {
      console.error("Error fetching sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // PUT /api/admin/sidebar-config - Cập nhật cấu hình sidebar
  async updateSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      const { menuItems } = req.body;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!menuItems || !Array.isArray(menuItems)) {
        return res.status(400).json({
          success: false,
          message: "Invalid menu items data",
        });
      }

      // Validate menu items structure
      for (const item of menuItems) {
        if (!item.id || !item.name || !item.href || !item.icon) {
          return res.status(400).json({
            success: false,
            message: "Invalid menu item structure",
          });
        }
      }

      // Tìm cấu hình hiện tại của user
      let config = await SidebarConfig.findOne({
        userId: userId,
        role: userRole,
      });

      if (config) {
        // Cập nhật cấu hình hiện tại
        config.menuItems = menuItems;
        config.isDefault = false; // Đánh dấu là cấu hình cá nhân
        await config.save();
      } else {
        // Tạo cấu hình mới cho user
        config = new SidebarConfig({
          userId: userId,
          menuItems: menuItems,
          isDefault: false,
          role: userRole,
        });
        await config.save();
      }

      res.json({
        success: true,
        message: "Sidebar configuration updated successfully",
        data: {
          menuItems: config.menuItems,
          role: config.role,
          isDefault: config.isDefault,
        },
      });
    } catch (error) {
      console.error("Error updating sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/admin/sidebar-config/reset - Reset về cấu hình mặc định
  async resetSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Xóa cấu hình cá nhân của user
      await SidebarConfig.deleteOne({
        userId: userId,
        role: userRole,
      });

      // Trả về cấu hình mặc định
      const defaultItems =
        userRole === "admin" ? defaultAdminMenuItems : defaultEmployeeMenuItems;

      res.json({
        success: true,
        message: "Sidebar configuration reset to default",
        data: {
          menuItems: defaultItems,
          role: userRole,
          isDefault: true,
        },
      });
    } catch (error) {
      console.error("Error resetting sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // GET /api/admin/sidebar-config/default - Lấy cấu hình mặc định
  async getDefaultSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;

      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const defaultItems =
        userRole === "admin" ? defaultAdminMenuItems : defaultEmployeeMenuItems;

      res.json({
        success: true,
        data: {
          menuItems: defaultItems,
          role: userRole,
          isDefault: true,
        },
      });
    } catch (error) {
      console.error("Error fetching default sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/admin/sidebar-config/create-default - Tạo cấu hình mặc định (admin only)
  async createDefaultSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      // Tạo cấu hình mặc định cho admin
      const adminConfig = await SidebarConfig.findOneAndUpdate(
        { isDefault: true, role: "admin" },
        {
          userId: null,
          menuItems: defaultAdminMenuItems,
          isDefault: true,
          role: "admin",
        },
        { upsert: true, new: true }
      );

      // Tạo cấu hình mặc định cho employee
      const employeeConfig = await SidebarConfig.findOneAndUpdate(
        { isDefault: true, role: "employee" },
        {
          userId: null,
          menuItems: defaultEmployeeMenuItems,
          isDefault: true,
          role: "employee",
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: "Default sidebar configurations created successfully",
        data: {
          admin: adminConfig,
          employee: employeeConfig,
        },
      });
    } catch (error) {
      console.error("Error creating default sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
