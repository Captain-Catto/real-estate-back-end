import { Request, Response } from "express";
import { HeaderMenu, IHeaderMenu, IDropdownItem } from "../models";
import { Types } from "mongoose";

// Default header menus for initial setup
const defaultHeaderMenus = [
  {
    label: "Trang chủ",
    href: "/",
    order: 1,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
  {
    label: "Mua bán",
    href: "/mua-ban",
    order: 2,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "2-1",
        label: "Bán căn hộ chung cư",
        href: "/mua-ban/ban-can-ho-chung-cu",
        order: 1,
        isActive: true,
      },
      {
        id: "2-2",
        label: "Bán nhà riêng",
        href: "/mua-ban/ban-nha-rieng",
        order: 2,
        isActive: true,
      },
      {
        id: "2-3",
        label: "Bán nhà biệt thự, liền kề",
        href: "/mua-ban/ban-nha-biet-thu-lien-ke",
        order: 3,
        isActive: true,
      },
      {
        id: "2-4",
        label: "Bán nhà mặt phố",
        href: "/mua-ban/ban-nha-mat-pho",
        order: 4,
        isActive: true,
      },
    ],
  },
  {
    label: "Cho thuê",
    href: "/cho-thue",
    order: 3,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "3-1",
        label: "Cho thuê căn hộ chung cư",
        href: "/cho-thue/cho-thue-can-ho-chung-cu",
        order: 1,
        isActive: true,
      },
      {
        id: "3-2",
        label: "Cho thuê nhà riêng",
        href: "/cho-thue/cho-thue-nha-rieng",
        order: 2,
        isActive: true,
      },
    ],
  },
  {
    label: "Dự án",
    href: "/du-an",
    order: 4,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "4-1",
        label: "Căn hộ chung cư",
        href: "/du-an/can-ho-chung-cu",
        order: 1,
        isActive: true,
      },
      {
        id: "4-2",
        label: "Cao ốc văn phòng",
        href: "/du-an/cao-oc-van-phong",
        order: 2,
        isActive: true,
      },
    ],
  },
  {
    label: "Tin tức",
    href: "/tin-tuc",
    order: 5,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "5-1",
        label: "Thị trường BĐS",
        href: "/tin-tuc/thi-truong-bds",
        order: 1,
        isActive: true,
      },
      {
        id: "5-2",
        label: "Phong thủy",
        href: "/tin-tuc/phong-thuy",
        order: 2,
        isActive: true,
      },
    ],
  },
  {
    label: "Liên hệ",
    href: "/lien-he",
    order: 6,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
];

export class HeaderSettingsController {
  // GET /api/admin/header-settings
  static async getHeaderMenus(req: Request, res: Response) {
    try {
      // Get all header menus from database, sorted by order
      const headerMenus = await HeaderMenu.find().sort({ order: 1 });

      // If no menus exist, create default ones
      if (headerMenus.length === 0) {
        await HeaderMenu.insertMany(defaultHeaderMenus);
        const newMenus = await HeaderMenu.find().sort({ order: 1 });

        return res.json({
          success: true,
          data: newMenus,
          message: "Default header menus created and retrieved successfully",
        });
      }

      res.json({
        success: true,
        data: headerMenus,
        message: "Header menus retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting header menus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/admin/header-settings
  static async createHeaderMenu(req: Request, res: Response) {
    try {
      const { label, href, order, isActive, hasDropdown, dropdownItems } =
        req.body;

      // Validate required fields
      if (!label || !href) {
        return res.status(400).json({
          success: false,
          message: "Label and href are required",
        });
      }

      // Process dropdown items - generate IDs if not provided
      const processedDropdownItems =
        dropdownItems?.map((item: any, index: number) => ({
          ...item,
          id: item.id || `dropdown-${Date.now()}-${index}`,
        })) || [];

      const newMenu = new HeaderMenu({
        label,
        href,
        order: order || (await HeaderMenu.countDocuments()) + 1,
        isActive: isActive !== undefined ? isActive : true,
        hasDropdown: hasDropdown || false,
        dropdownItems: processedDropdownItems,
      });

      await newMenu.save();

      // Return all menus sorted by order
      const allMenus = await HeaderMenu.find().sort({ order: 1 });

      res.status(201).json({
        success: true,
        data: allMenus,
        message: "Header menu created successfully",
      });
    } catch (error) {
      console.error("Error creating header menu:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // PUT /api/admin/header-settings/:id
  static async updateHeaderMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { label, href, order, isActive, hasDropdown, dropdownItems } =
        req.body;

      const menu = await HeaderMenu.findById(id);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: "Header menu not found",
        });
      }

      // Process dropdown items
      const processedDropdownItems =
        dropdownItems?.map((item: any, index: number) => ({
          ...item,
          id: item.id || `${id}-${index + 1}`,
        })) || [];

      // Update menu fields
      if (label !== undefined) menu.label = label;
      if (href !== undefined) menu.href = href;
      if (order !== undefined) menu.order = order;
      if (isActive !== undefined) menu.isActive = isActive;
      if (hasDropdown !== undefined) menu.hasDropdown = hasDropdown;
      menu.dropdownItems = processedDropdownItems;

      await menu.save();

      // Return all menus sorted by order
      const allMenus = await HeaderMenu.find().sort({ order: 1 });

      res.json({
        success: true,
        data: allMenus,
        message: "Header menu updated successfully",
      });
    } catch (error) {
      console.error("Error updating header menu:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // DELETE /api/admin/header-settings/:id
  static async deleteHeaderMenu(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const menu = await HeaderMenu.findById(id);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: "Header menu not found",
        });
      }

      await HeaderMenu.findByIdAndDelete(id);

      // Return remaining menus sorted by order
      const remainingMenus = await HeaderMenu.find().sort({ order: 1 });

      res.json({
        success: true,
        data: remainingMenus,
        message: "Header menu deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting header menu:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // PUT /api/admin/header-settings/reorder
  static async updateMenuOrder(req: Request, res: Response) {
    try {
      const { menus } = req.body;

      if (!Array.isArray(menus)) {
        return res.status(400).json({
          success: false,
          message: "Menus array is required",
        });
      }

      console.log("Received menus for reordering:", menus);

      // Validate and convert IDs to ObjectId format
      const validMenus = menus.filter(({ id, order }) => {
        if (!id || typeof order !== "number") {
          console.warn(`Invalid menu data:`, { id, order });
          return false;
        }

        // Check if ID is a valid ObjectId
        if (!Types.ObjectId.isValid(id)) {
          console.warn(`Invalid ObjectId:`, id);
          return false;
        }

        return true;
      });

      if (validMenus.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No valid menu data provided",
        });
      }

      // Update order for each menu using bulk operations
      // Frontend sends id field, but MongoDB uses _id
      const bulkOps = validMenus.map(({ id, order }) => ({
        updateOne: {
          filter: { _id: new Types.ObjectId(id) },
          update: { order },
        },
      }));

      console.log("Bulk operations:", bulkOps);

      const result = await HeaderMenu.bulkWrite(bulkOps);
      console.log("Bulk write result:", result);

      // Return updated menus sorted by order
      const updatedMenus = await HeaderMenu.find().sort({ order: 1 });

      res.json({
        success: true,
        data: updatedMenus,
        message: "Menu order updated successfully",
      });
    } catch (error) {
      console.error("Error updating menu order:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // PATCH /api/admin/header-settings/:id/toggle
  static async toggleMenuStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const menu = await HeaderMenu.findById(id);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: "Header menu not found",
        });
      }

      menu.isActive = isActive;
      await menu.save();

      // Return all menus sorted by order
      const allMenus = await HeaderMenu.find().sort({ order: 1 });

      res.json({
        success: true,
        data: allMenus,
        message: "Menu status updated successfully",
      });
    } catch (error) {
      console.error("Error toggling menu status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/admin/header-settings/reset
  static async resetToDefault(req: Request, res: Response) {
    try {
      // Delete all existing menus
      await HeaderMenu.deleteMany({});

      // Create default menus
      await HeaderMenu.insertMany(defaultHeaderMenus);

      // Return new default menus
      const newMenus = await HeaderMenu.find().sort({ order: 1 });

      res.json({
        success: true,
        data: newMenus,
        message: "Header menus reset to default successfully",
      });
    } catch (error) {
      console.error("Error resetting header menus:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
