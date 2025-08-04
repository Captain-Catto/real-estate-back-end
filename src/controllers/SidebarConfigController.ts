import { Request, Response } from "express";
import SidebarConfig, { IMenuItem } from "../models/SidebarConfig";

/**
 * SidebarConfigController
 *
 * Controller xử lý các API endpoints liên quan đến cấu hình sidebar
 */
export class SidebarConfigController {
  /**
   * Lấy cấu hình sidebar cho người dùng hiện tại dựa theo role
   * GET /api/sidebar-config
   */
  static async getSidebarConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Người dùng chưa đăng nhập",
        });
      }

      // Lấy role từ query parameter nếu người dùng là admin (để preview sidebar theo role khác)
      const requestedRole = req.query.role as string | undefined;

      // Xác định role cuối cùng để lấy menu
      // Nếu là admin và có yêu cầu xem role khác, dùng role được yêu cầu
      // Ngược lại, dùng role hiện tại của user
      const effectiveRole =
        user.role === "admin" && requestedRole ? requestedRole : user.role;

      // Đảm bảo có cấu hình mặc định
      await SidebarConfig.createDefaultConfig();

      // Lấy menu items cho role hiện tại
      const menuItems = await SidebarConfig.getMenuForRole(effectiveRole);

      return res.json({
        success: true,
        data: {
          items: menuItems,
          role: effectiveRole,
        },
        message: "Lấy cấu hình sidebar thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy cấu hình sidebar:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Lấy toàn bộ menu items (chỉ dành cho admin)
   * GET /api/admin/sidebar-config/items
   */
  static async getAllMenuItems(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Đảm bảo có cấu hình mặc định
      await SidebarConfig.createDefaultConfig();

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      return res.json({
        success: true,
        data: {
          items: defaultConfig.items,
        },
        message: "Lấy danh sách menu items thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách menu items:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Cập nhật trạng thái hiển thị của menu item
   * PUT /api/admin/sidebar-config/item/:id/visibility
   */
  static async updateMenuItemVisibility(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { isVisible } = req.body;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      if (typeof isVisible !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isVisible phải là kiểu boolean",
        });
      }

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Tìm và cập nhật menu item
      const itemIndex = defaultConfig.items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy menu item",
        });
      }

      // Cập nhật trạng thái hiển thị
      defaultConfig.items[itemIndex].isVisible = isVisible;
      await defaultConfig.save();

      return res.json({
        success: true,
        message: `Đã ${isVisible ? "hiện" : "ẩn"} menu item thành công`,
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái hiển thị:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Cập nhật quyền truy cập của menu item
   * PUT /api/admin/sidebar-config/item/:id/roles
   */
  static async updateMenuItemRoles(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { allowedRoles } = req.body;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      if (!Array.isArray(allowedRoles)) {
        return res.status(400).json({
          success: false,
          message: "allowedRoles phải là mảng các roles",
        });
      }

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Tìm và cập nhật menu item
      const itemIndex = defaultConfig.items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy menu item",
        });
      }

      // Cập nhật quyền truy cập
      defaultConfig.items[itemIndex].allowedRoles = allowedRoles;
      await defaultConfig.save();

      return res.json({
        success: true,
        message: "Đã cập nhật quyền truy cập thành công",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền truy cập:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Thêm menu item mới
   * POST /api/admin/sidebar-config/item
   */
  static async addMenuItem(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { title, path, order, parentId, allowedRoles, metadata } = req.body;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Kiểm tra dữ liệu đầu vào
      if (!title || !path) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc: title, path",
        });
      }

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Tạo ID mới dựa trên title (slug)
      const id = title.toLowerCase().replace(/\s+/g, "-");

      // Kiểm tra ID đã tồn tại chưa
      const existingItem = defaultConfig.items.find((item) => item.id === id);
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: "Menu item với ID này đã tồn tại",
        });
      }

      // Tạo menu item mới
      const newItem: IMenuItem = {
        id,
        title,
        path,
        order: order || defaultConfig.items.length,
        isVisible: true,
        allowedRoles: allowedRoles || ["admin"],
        parentId,
        metadata: metadata || {},
      };

      // Thêm vào cấu hình
      defaultConfig.items.push(newItem);
      await defaultConfig.save();

      return res.status(201).json({
        success: true,
        data: {
          item: newItem,
        },
        message: "Thêm menu item mới thành công",
      });
    } catch (error) {
      console.error("Lỗi khi thêm menu item:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Xóa menu item
   * DELETE /api/admin/sidebar-config/item/:id
   */
  static async deleteMenuItem(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Tìm menu item cần xóa
      const itemIndex = defaultConfig.items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy menu item",
        });
      }

      // Xóa menu item
      defaultConfig.items.splice(itemIndex, 1);
      await defaultConfig.save();

      return res.json({
        success: true,
        message: "Đã xóa menu item thành công",
      });
    } catch (error) {
      console.error("Lỗi khi xóa menu item:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Reset cấu hình sidebar về mặc định
   * POST /api/admin/sidebar-config/reset
   */
  static async resetSidebarConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Xóa cấu hình hiện tại
      await SidebarConfig.deleteMany({ isDefault: true });

      // Tạo lại cấu hình mặc định
      const newConfig = await SidebarConfig.createDefaultConfig();

      return res.json({
        success: true,
        data: {
          config: newConfig,
        },
        message: "Đã reset cấu hình sidebar về mặc định",
      });
    } catch (error) {
      console.error("Lỗi khi reset cấu hình sidebar:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }

  /**
   * Cập nhật thứ tự hiển thị của menu item
   * PUT /api/admin/sidebar-config/item/:id/order
   */
  static async updateMenuItemOrder(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { order } = req.body;

      if (!user || user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      if (typeof order !== "number") {
        return res.status(400).json({
          success: false,
          message: "order phải là số",
        });
      }

      // Lấy cấu hình mặc định
      const defaultConfig = await SidebarConfig.findOne({ isDefault: true });

      if (!defaultConfig) {
        return res.status(500).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Tìm và cập nhật menu item
      const itemIndex = defaultConfig.items.findIndex((item) => item.id === id);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy menu item",
        });
      }

      // Cập nhật thứ tự
      defaultConfig.items[itemIndex].order = order;
      await defaultConfig.save();

      return res.json({
        success: true,
        message: "Đã cập nhật thứ tự hiển thị thành công",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật thứ tự hiển thị:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  }
}
