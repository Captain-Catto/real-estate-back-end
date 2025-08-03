import { Request, Response } from "express";
import { Area, IArea } from "../models/Area";
import { AuthenticatedRequest } from "../middleware";

export class AreaController {
  // Lấy tất cả khoảng diện tích
  async getAllAreas(req: Request, res: Response) {
    try {
      const { type } = req.query;

      let filter: any = {};
      if (type && (type === "property" || type === "project")) {
        filter.type = type;
      }

      const areas = await Area.find(filter).sort({ type: 1, order: 1 });

      res.json({
        success: true,
        data: areas,
        message: "Lấy danh sách khoảng diện tích thành công",
      });
    } catch (error) {
      console.error("Error getting areas:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy danh sách khoảng diện tích với phân trang (cho admin)
  async getAreas(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const { type } = req.query;

      let filter: any = {};
      if (type && (type === "property" || type === "project")) {
        filter.type = type;
      }

      // Đếm tổng số khoảng diện tích
      const totalAreas = await Area.countDocuments(filter);

      // Lấy danh sách khoảng diện tích với phân trang
      const areas = await Area.find(filter, { __v: 0 })
        .sort({ type: 1, order: 1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: areas,
        pagination: {
          page,
          limit,
          total: totalAreas,
          totalPages: Math.ceil(totalAreas / limit),
        },
        message: "Lấy danh sách khoảng diện tích thành công",
      });
    } catch (error) {
      console.error("Error getting area ranges:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy chi tiết khoảng diện tích theo ID
  async getAreaById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const area = await Area.findById(id);
      if (!area) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng diện tích",
        });
      }

      res.json({
        success: true,
        data: area,
      });
    } catch (error) {
      console.error("Error getting area by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Admin methods
  // Tạo khoảng diện tích mới
  async createArea(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, slug, type, minValue, maxValue, order } = req.body;

      // Kiểm tra slug đã tồn tại chưa
      const existingArea = await Area.findOne({ slug });
      if (existingArea) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại",
        });
      }

      // Tạo ID tự động
      const id = `${type}_area_${Date.now()}`;

      const newArea = new Area({
        id,
        name,
        slug,
        type,
        minValue: parseFloat(minValue) || 0,
        maxValue: parseFloat(maxValue) || -1,
        order: parseInt(order) || 0,
        isActive: true,
      });

      await newArea.save();

      res.status(201).json({
        success: true,
        data: newArea,
        message: "Tạo khoảng diện tích thành công",
      });
    } catch (error) {
      console.error("Error creating area:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cập nhật khoảng diện tích
  async updateArea(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, type, minValue, maxValue, order, isActive } =
        req.body;

      const area = await Area.findById(id);
      if (!area) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng diện tích",
        });
      }

      // Kiểm tra slug nếu thay đổi
      if (slug !== area.slug) {
        const existingArea = await Area.findOne({ slug });
        if (existingArea) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại",
          });
        }
      }

      // Cập nhật thông tin
      area.name = name || area.name;
      area.slug = slug || area.slug;
      area.type = type || area.type;
      area.minValue =
        minValue !== undefined ? parseFloat(minValue) : area.minValue;
      area.maxValue =
        maxValue !== undefined ? parseFloat(maxValue) : area.maxValue;
      area.order = order !== undefined ? parseInt(order) : area.order;
      area.isActive = isActive !== undefined ? isActive : area.isActive;

      await area.save();

      res.json({
        success: true,
        data: area,
        message: "Cập nhật khoảng diện tích thành công",
      });
    } catch (error) {
      console.error("Error updating area:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Xóa khoảng diện tích
  async deleteArea(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const area = await Area.findByIdAndDelete(id);
      if (!area) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng diện tích",
        });
      }

      res.json({
        success: true,
        message: "Xóa khoảng diện tích thành công",
      });
    } catch (error) {
      console.error("Error deleting area:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa khoảng diện tích",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cập nhật thứ tự hiển thị
  async updateAreaOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { areas } = req.body; // Array of { id, order }

      if (!Array.isArray(areas)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }

      // Cập nhật thứ tự cho từng area
      const updatePromises = areas.map(async (item: any) => {
        return Area.findByIdAndUpdate(
          item.id,
          { order: parseInt(item.order) },
          { new: true }
        );
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: "Cập nhật thứ tự thành công",
      });
    } catch (error) {
      console.error("Error updating area order:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thứ tự",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Toggle trạng thái active
  async toggleAreaStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const area = await Area.findById(id);
      if (!area) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng diện tích",
        });
      }

      area.isActive = !area.isActive;
      await area.save();

      res.json({
        success: true,
        data: area,
        message: `${
          area.isActive ? "Kích hoạt" : "Vô hiệu hóa"
        } khoảng diện tích thành công`,
      });
    } catch (error) {
      console.error("Error toggling area status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thay đổi trạng thái",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy khoảng diện tích theo type
  async getAreasByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      // Validate type parameter
      if (!type || !["property", "project"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type không hợp lệ. Chỉ chấp nhận 'property' hoặc 'project'",
        });
      }

      const areas = await Area.find({ type, isActive: true }).sort({
        order: 1,
      });

      res.json({
        success: true,
        data: areas,
        message: `Lấy danh sách khoảng diện tích ${type} thành công`,
      });
    } catch (error) {
      console.error(`Error getting areas by type ${req.params.type}:`, error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng diện tích theo loại",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export const areaController = new AreaController();
