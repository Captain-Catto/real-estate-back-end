import { Request, Response } from "express";
import SidebarConfig from "../models/SidebarConfig";
import { IMenuItem } from "../models/SidebarConfig";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "employee";
  };
}

export class SidebarController {
  // Lấy cấu hình sidebar theo role
  static async getSidebarConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const userRole = req.user?.role;

      if (!userRole || !["admin", "employee"].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      // Lấy cấu hình mặc định
      const config = await SidebarConfig.findOne({ isDefault: true }).lean();

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình sidebar",
        });
      }

      // Lọc menu theo role và sắp xếp
      const filteredItems = config.items
        .filter(
          (item: IMenuItem) =>
            item.isVisible && item.allowedRoles.includes(userRole)
        )
        .sort((a: IMenuItem, b: IMenuItem) => a.order - b.order);

      const filteredConfig = {
        ...config,
        items: filteredItems,
      };

      res.json({
        success: true,
        data: filteredConfig,
      });
    } catch (error) {
      console.error("Error getting sidebar config:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy cấu hình sidebar",
      });
    }
  }

  // Lấy tất cả cấu hình (chỉ admin)
  static async getAllConfigs(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền truy cập",
        });
      }

      const configs = await SidebarConfig.find()
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();

      res.json({
        success: true,
        data: configs,
      });
    } catch (error) {
      console.error("Error getting all configs:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách cấu hình",
      });
    }
  }

  // Tạo cấu hình mới (chỉ admin)
  static async createConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền tạo cấu hình",
        });
      }

      const { name, items, isDefault } = req.body;

      // Validate dữ liệu
      if (!name || !items || !Array.isArray(items)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }

      // Nếu đặt làm mặc định, bỏ mặc định của các config khác
      if (isDefault) {
        await SidebarConfig.updateMany({}, { $set: { isDefault: false } });
      }

      // Đảm bảo order cho items và chỉ giữ admin/employee roles
      const processedItems = items.map((item: any, index: number) => ({
        ...item,
        order: item.order ?? index + 1,
        allowedRoles: item.allowedRoles?.filter((role: string) =>
          ["admin", "employee"].includes(role)
        ) || ["admin"],
      }));

      const newConfig = new SidebarConfig({
        name,
        items: processedItems,
        isDefault: isDefault || false,
      });

      const savedConfig = await newConfig.save();

      res.status(201).json({
        success: true,
        data: savedConfig,
        message: "Tạo cấu hình sidebar thành công",
      });
    } catch (error) {
      console.error("Error creating config:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo cấu hình",
      });
    }
  }

  // Cập nhật cấu hình (chỉ admin)
  static async updateConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền cập nhật cấu hình",
        });
      }

      const { id } = req.params;
      const updateData = req.body;

      // Lấy config hiện tại
      const currentConfig = await SidebarConfig.findById(id);
      if (!currentConfig) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      // Validate items nếu có trong updateData
      if (updateData.items && !Array.isArray(updateData.items)) {
        return res.status(400).json({
          success: false,
          message: "Items phải là một mảng",
        });
      }

      // Nếu đặt làm mặc định, bỏ mặc định của các config khác
      if (updateData.isDefault) {
        await SidebarConfig.updateMany(
          { _id: { $ne: id } },
          { $set: { isDefault: false } }
        );
      }

      // Chuẩn bị dữ liệu cập nhật
      const updateFields: any = {};

      if (updateData.name) {
        updateFields.name = updateData.name;
      }

      if (updateData.items) {
        // Đảm bảo order cho items và chỉ giữ admin/employee roles
        const processedItems = updateData.items.map(
          (item: any, index: number) => ({
            ...item,
            order: item.order ?? index + 1,
            allowedRoles: item.allowedRoles?.filter((role: string) =>
              ["admin", "employee"].includes(role)
            ) || ["admin"],
          })
        );
        updateFields.items = processedItems;
      }

      if (typeof updateData.isDefault === "boolean") {
        updateFields.isDefault = updateData.isDefault;
      }

      const updatedConfig = await SidebarConfig.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true, runValidators: true }
      );

      if (!updatedConfig) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      res.json({
        success: true,
        data: updatedConfig,
        message: "Cập nhật cấu hình thành công",
      });
    } catch (error) {
      console.error("Error updating config:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật cấu hình",
      });
    }
  }

  // Xóa cấu hình (chỉ admin)
  static async deleteConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền xóa cấu hình",
        });
      }

      const { id } = req.params;

      const config = await SidebarConfig.findById(id);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      // Không cho phép xóa cấu hình mặc định cuối cùng
      if (config.isDefault) {
        const defaultCount = await SidebarConfig.countDocuments({
          isDefault: true,
        });
        if (defaultCount <= 1) {
          return res.status(400).json({
            success: false,
            message: "Không thể xóa cấu hình mặc định cuối cùng",
          });
        }
      }

      await SidebarConfig.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa cấu hình thành công",
      });
    } catch (error) {
      console.error("Error deleting config:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa cấu hình",
      });
    }
  }

  // Đặt cấu hình mặc định (chỉ admin)
  static async setDefaultConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền đặt cấu hình mặc định",
        });
      }

      const { id } = req.params;

      // Bỏ mặc định của tất cả config khác
      await SidebarConfig.updateMany({}, { $set: { isDefault: false } });

      // Đặt config này làm mặc định
      const updatedConfig = await SidebarConfig.findByIdAndUpdate(
        id,
        { isDefault: true },
        { new: true }
      );

      if (!updatedConfig) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      res.json({
        success: true,
        data: updatedConfig,
        message: "Đặt cấu hình mặc định thành công",
      });
    } catch (error) {
      console.error("Error setting default config:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi đặt cấu hình mặc định",
      });
    }
  }

  // Sắp xếp lại thứ tự items (chỉ admin)
  static async reorderItems(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền sắp xếp menu",
        });
      }

      const { configId } = req.params;
      const { itemOrders } = req.body; // [{ id: "item1", order: 1 }, ...]

      if (!Array.isArray(itemOrders)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }

      const config = await SidebarConfig.findById(configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      // Cập nhật order cho từng item
      config.items.forEach((item: any) => {
        const orderInfo = itemOrders.find(
          (orderItem: any) => orderItem.id === item.id
        );
        if (orderInfo) {
          item.order = orderInfo.order;
        }
      });

      // Sắp xếp lại items theo order
      config.items.sort((a: any, b: any) => a.order - b.order);

      const savedConfig = await config.save();

      res.json({
        success: true,
        data: savedConfig,
        message: "Sắp xếp items thành công",
      });
    } catch (error) {
      console.error("Error reordering items:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi sắp xếp items",
      });
    }
  }

  // Thêm menu item mới (chỉ admin)
  static async addMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền thêm menu",
        });
      }

      const { configId } = req.params;
      const {
        id,
        title,
        path,
        parentId,
        order,
        isVisible,
        allowedRoles,
        metadata,
      } = req.body;

      if (!id || !title || !path) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin bắt buộc",
        });
      }

      const config = await SidebarConfig.findById(configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      // Kiểm tra ID đã tồn tại
      const existingItem = config.items.find((item: any) => item.id === id);
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: "ID menu đã tồn tại",
        });
      }

      // Tạo menu item mới
      const newItem: IMenuItem = {
        id,
        title,
        path,
        parentId: parentId || undefined,
        order: order || config.items.length + 1,
        isVisible: isVisible !== false,
        allowedRoles: allowedRoles?.filter((role: string) =>
          ["admin", "employee"].includes(role)
        ) || ["admin"],
        metadata: metadata || {},
      };

      config.items.push(newItem);

      // Sắp xếp lại theo order
      config.items.sort((a: any, b: any) => a.order - b.order);

      const savedConfig = await config.save();

      res.json({
        success: true,
        data: savedConfig,
        message: "Thêm menu item thành công",
      });
    } catch (error) {
      console.error("Error adding menu item:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi thêm menu item",
      });
    }
  }

  // Xóa menu item (chỉ admin)
  static async removeMenuItem(req: AuthenticatedRequest, res: Response) {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin mới có quyền xóa menu",
        });
      }

      const { configId, itemId } = req.params;

      const config = await SidebarConfig.findById(configId);

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy cấu hình",
        });
      }

      // Tìm và xóa item
      const itemIndex = config.items.findIndex(
        (item: any) => item.id === itemId
      );

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy menu item",
        });
      }

      config.items.splice(itemIndex, 1);

      // Xóa các menu con nếu có
      config.items = config.items.filter(
        (item: any) => item.parentId !== itemId
      );

      const savedConfig = await config.save();

      res.json({
        success: true,
        data: savedConfig,
        message: "Xóa menu item thành công",
      });
    } catch (error) {
      console.error("Error removing menu item:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa menu item",
      });
    }
  }
}
