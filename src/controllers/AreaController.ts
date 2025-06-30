import { Area } from "../models";
import { Request, Response } from "express";

export class AreaController {
  // Lấy danh sách khoảng diện tích với phân trang
  async getAreas(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Đếm tổng số khoảng diện tích
      const totalAreas = await Area.countDocuments();

      // Lấy danh sách khoảng diện tích với phân trang
      const areas = await Area.find({}, { __v: 0 })
        .sort({ id: 1 }) // Sắp xếp theo id
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          areas,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalAreas / limit),
            totalItems: totalAreas,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching areas:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin chi tiết khoảng diện tích theo slug
  async getAreaBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const area = await Area.findOne({ slug });

      if (!area) {
        return res
          .status(404)
          .json({ success: false, message: "Area not found" });
      }

      res.json({ success: true, data: area });
    } catch (error) {
      console.error("Error fetching area by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy tất cả khoảng diện tích (không phân trang - hữu ích cho dropdown)
  async getAllAreas(req: Request, res: Response) {
    try {
      const areas = await Area.find({}, { __v: 0 }).sort({ id: 1 });

      res.json({ success: true, data: areas });
    } catch (error) {
      console.error("Error fetching all areas:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
