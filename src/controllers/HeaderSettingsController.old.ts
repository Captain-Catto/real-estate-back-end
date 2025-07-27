import { Request, Response } from "express";
import { HeaderMenu, IHeaderMenu, IDropdownItem } from "../models";

interface DropdownItem {
  id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  children?: DropdownItem[];
}

interface HeaderMenu {
  id: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  hasDropdown: boolean;
  dropdownItems: DropdownItem[];
}

// Mock data for development - in production this would come from database
const defaultHeaderMenus: HeaderMenu[] = [
  {
    id: "1",
    label: "Trang chủ",
    href: "/",
    order: 1,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
  {
    id: "2",
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
    ],
  },
  {
    id: "3",
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
      {
        id: "3-3",
        label: "Cho thuê nhà mặt phố",
        href: "/cho-thue/cho-thue-nha-mat-pho",
        order: 3,
        isActive: true,
      },
    ],
  },
  {
    id: "4",
    label: "Dự án",
    href: "/du-an",
    order: 4,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
  {
    id: "5",
    label: "Tin tức",
    href: "/tin-tuc",
    order: 5,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "5-1",
        label: "Thị trường BDS",
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
      {
        id: "5-3",
        label: "Tư vấn pháp lý",
        href: "/tin-tuc/tu-van-phap-ly",
        order: 3,
        isActive: true,
      },
    ],
  },
  {
    id: "6",
    label: "Liên hệ",
    href: "/lien-he",
    order: 6,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
];

// In-memory storage for development (in production, use database)
let headerMenusStorage: HeaderMenu[] = [...defaultHeaderMenus];

export class HeaderSettingsController {
  // GET /api/admin/header-settings
  static async getHeaderMenus(req: Request, res: Response) {
    try {
      // Sort by order
      const sortedMenus = headerMenusStorage
        .slice()
        .sort((a, b) => a.order - b.order);

      res.json({
        success: true,
        data: sortedMenus,
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

      // Generate new ID
      const newId = (
        Math.max(...headerMenusStorage.map((m) => parseInt(m.id))) + 1
      ).toString();

      // Process dropdown items
      const processedDropdownItems =
        dropdownItems?.map((item: any, index: number) => ({
          ...item,
          id: item.id || `${newId}-${index + 1}`,
        })) || [];

      const newMenu: HeaderMenu = {
        id: newId,
        label,
        href,
        order: order || headerMenusStorage.length + 1,
        isActive: isActive !== undefined ? isActive : true,
        hasDropdown: hasDropdown || false,
        dropdownItems: processedDropdownItems,
      };

      headerMenusStorage.push(newMenu);

      res.status(201).json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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

      const menuIndex = headerMenusStorage.findIndex((m) => m.id === id);
      if (menuIndex === -1) {
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

      // Update menu
      headerMenusStorage[menuIndex] = {
        ...headerMenusStorage[menuIndex],
        label: label || headerMenusStorage[menuIndex].label,
        href: href || headerMenusStorage[menuIndex].href,
        order:
          order !== undefined ? order : headerMenusStorage[menuIndex].order,
        isActive:
          isActive !== undefined
            ? isActive
            : headerMenusStorage[menuIndex].isActive,
        hasDropdown:
          hasDropdown !== undefined
            ? hasDropdown
            : headerMenusStorage[menuIndex].hasDropdown,
        dropdownItems: processedDropdownItems,
      };

      res.json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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

      const menuIndex = headerMenusStorage.findIndex((m) => m.id === id);
      if (menuIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Header menu not found",
        });
      }

      headerMenusStorage.splice(menuIndex, 1);

      res.json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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

      // Update order for each menu
      menus.forEach(({ id, order }) => {
        const menuIndex = headerMenusStorage.findIndex((m) => m.id === id);
        if (menuIndex !== -1) {
          headerMenusStorage[menuIndex].order = order;
        }
      });

      res.json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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

      const menuIndex = headerMenusStorage.findIndex((m) => m.id === id);
      if (menuIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "Header menu not found",
        });
      }

      headerMenusStorage[menuIndex].isActive = isActive;

      res.json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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
      headerMenusStorage = [...defaultHeaderMenus];

      res.json({
        success: true,
        data: headerMenusStorage.sort((a, b) => a.order - b.order),
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
