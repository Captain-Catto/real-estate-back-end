import { PriceRange } from "../models/Price";
import { Request, Response } from "express";

export class PriceRangeController {
  // Lấy danh sách khoảng giá với phân trang
  async getPriceRanges(req: Request, res: Response) {
    try {
      // Lấy tham số phân trang từ query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Lấy filter từ query params
      const filter: any = {};

      // Nếu có tham số type trong query
      if (req.query.type) {
        filter.type = req.query.type;
      }

      // Đếm tổng số khoảng giá theo filter
      const totalPriceRanges = await PriceRange.countDocuments(filter);

      // Kiểm tra nếu không có dữ liệu
      if (totalPriceRanges === 0) {
        return res.json({
          success: true,
          data: {
            priceRanges: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
            },
          },
        });
      }

      // Lấy dữ liệu với phân trang
      const priceRanges = await PriceRange.find(filter, { __v: 0 })
        .sort({ id: 1 }) // Sắp xếp theo id
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          priceRanges,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPriceRanges / limit),
            totalItems: totalPriceRanges,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching price ranges:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin chi tiết khoảng giá theo slug
  async getPriceRangeBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const priceRange = await PriceRange.findOne({ slug });

      if (!priceRange) {
        return res
          .status(404)
          .json({ success: false, message: "Price range not found" });
      }

      res.json({ success: true, data: priceRange });
    } catch (error) {
      console.error("Error fetching price range by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin chi tiết khoảng giá theo type (ban hoặc thue) với phân trang
  async getPriceRangeByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      // Lấy tham số phân trang từ query
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Đếm tổng số khoảng giá theo type
      const totalPriceRanges = await PriceRange.countDocuments({ type });

      // Kiểm tra nếu không có dữ liệu
      if (totalPriceRanges === 0) {
        return res.json({
          success: true,
          data: {
            priceRanges: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
            },
          },
        });
      }

      // Lấy dữ liệu với phân trang
      const priceRanges = await PriceRange.find({ type }, { __v: 0 })
        .sort({ id: 1 }) // Sắp xếp theo id
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          priceRanges,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPriceRanges / limit),
            totalItems: totalPriceRanges,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching price range by type:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy tất cả khoảng giá theo type (không phân trang - hữu ích cho dropdown)
  async getAllPriceRangesByType(req: Request, res: Response) {
    try {
      const { type } = req.params;

      // Lấy tất cả dữ liệu của type
      const priceRanges = await PriceRange.find({ type }, { __v: 0 }).sort({
        id: 1,
      });

      // Kiểm tra nếu không có dữ liệu
      if (!priceRanges || priceRanges.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No price ranges found with this type",
        });
      }

      res.json({
        success: true,
        data: priceRanges,
      });
    } catch (error) {
      console.error("Error fetching all price ranges by type:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
