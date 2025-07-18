import { Request, Response } from "express";
import { PriceRange } from "../models/Price";
import { AuthenticatedRequest } from "../middleware";

export class PriceController {
  // Lấy tất cả khoảng giá
  async getAllPrices(req: Request, res: Response) {
    try {
      const { type } = req.query;

      let filter: any = {};
      if (
        type &&
        (type === "ban" || type === "cho-thue" || type === "project")
      ) {
        filter.type = type;
      }

      const prices = await PriceRange.find(filter).sort({ type: 1, order: 1 });

      res.json({
        success: true,
        data: prices,
        message: "Lấy danh sách khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error getting prices:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy danh sách khoảng giá với phân trang (cho admin)
  async getPrices(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const { type } = req.query;

      let filter: any = {};
      if (
        type &&
        (type === "ban" || type === "cho-thue" || type === "project")
      ) {
        filter.type = type;
      }

      // Đếm tổng số khoảng giá
      const totalPrices = await PriceRange.countDocuments(filter);

      // Lấy danh sách khoảng giá với phân trang
      const prices = await PriceRange.find(filter, { __v: 0 })
        .sort({ type: 1, order: 1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: prices,
        pagination: {
          page,
          limit,
          total: totalPrices,
          totalPages: Math.ceil(totalPrices / limit),
        },
        message: "Lấy danh sách khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error getting price ranges:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy chi tiết khoảng giá theo ID
  async getPriceById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const price = await PriceRange.findById(id);
      if (!price) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng giá",
        });
      }

      res.json({
        success: true,
        data: price,
      });
    } catch (error) {
      console.error("Error getting price by ID:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Admin methods
  // Tạo khoảng giá mới
  async createPrice(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, slug, type, minValue, maxValue, order } = req.body;

      // Kiểm tra slug đã tồn tại chưa
      const existingPrice = await PriceRange.findOne({ slug });
      if (existingPrice) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại",
        });
      }

      // Tạo ID tự động
      const id = `${type}_price_${Date.now()}`;

      const newPrice = new PriceRange({
        id,
        name,
        slug,
        type,
        minValue: parseFloat(minValue) || 0,
        maxValue: parseFloat(maxValue) || -1,
        order: parseInt(order) || 0,
        isActive: true,
      });

      await newPrice.save();

      res.status(201).json({
        success: true,
        data: newPrice,
        message: "Tạo khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error creating price:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cập nhật khoảng giá
  async updatePrice(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, type, minValue, maxValue, order, isActive } =
        req.body;

      const price = await PriceRange.findById(id);
      if (!price) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng giá",
        });
      }

      // Kiểm tra slug nếu thay đổi
      if (slug !== price.slug) {
        const existingPrice = await PriceRange.findOne({ slug });
        if (existingPrice) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại",
          });
        }
      }

      // Cập nhật thông tin
      price.name = name || price.name;
      price.slug = slug || price.slug;
      price.type = type || price.type;
      if (minValue !== undefined) price.minValue = parseFloat(minValue);
      if (maxValue !== undefined) price.maxValue = parseFloat(maxValue);
      if (order !== undefined) price.order = parseInt(order);
      if (isActive !== undefined) price.isActive = isActive;

      await price.save();

      res.json({
        success: true,
        data: price,
        message: "Cập nhật khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error updating price:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Xóa khoảng giá
  async deletePrice(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const price = await PriceRange.findByIdAndDelete(id);
      if (!price) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng giá",
        });
      }

      res.json({
        success: true,
        message: "Xóa khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error deleting price:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi xóa khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Cập nhật thứ tự hiển thị
  async updatePriceOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { prices } = req.body; // Array of { id, order }

      if (!Array.isArray(prices)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }

      // Cập nhật thứ tự cho từng price
      const updatePromises = prices.map(async (item: any) => {
        return PriceRange.findByIdAndUpdate(
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
      console.error("Error updating price order:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi cập nhật thứ tự",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Toggle trạng thái active
  async togglePriceStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const price = await PriceRange.findById(id);
      if (!price) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy khoảng giá",
        });
      }

      price.isActive = !price.isActive;
      await price.save();

      res.json({
        success: true,
        data: price,
        message: `${
          price.isActive ? "Kích hoạt" : "Vô hiệu hóa"
        } khoảng giá thành công`,
      });
    } catch (error) {
      console.error("Error toggling price status:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thay đổi trạng thái",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Lấy khoảng giá theo type (cho frontend)
  async getPricesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      // Validate type
      if (!type || !["ban", "cho-thue", "project"].includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Type không hợp lệ. Chỉ chấp nhận: ban, cho-thue, project",
        });
      }

      const prices = await PriceRange.find({
        type: type,
        isActive: true,
      }).sort({ order: 1 });

      res.json({
        success: true,
        data: {
          priceRanges: prices,
        },
        message: "Lấy danh sách khoảng giá thành công",
      });
    } catch (error) {
      console.error("Error getting prices by type:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách khoảng giá",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

export const priceController = new PriceController();
