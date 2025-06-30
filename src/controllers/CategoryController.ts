import { Category } from "../models";
import { Request, Response } from "express";

export class CategoryController {
  // Lấy danh sách danh mục với phân trang
  async getCategories(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Lấy filter từ query params
      const filter: any = {};

      // Nếu có tham số isProject trong query
      if (req.query.isProject !== undefined) {
        filter.isProject = req.query.isProject === "true";
      }

      // Đếm tổng số danh mục theo filter
      const totalCategories = await Category.countDocuments(filter);

      // Lấy danh sách danh mục với phân trang
      const categories = await Category.find(filter, { __v: 0 })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
            totalItems: totalCategories,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin chi tiết danh mục theo slug
  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const category = await Category.findOne({ slug });

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      console.error("Error fetching category by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // lấy thông tin chi tiết danh mục theo isProject với phân trang
  async getCategoryByIsProject(req: Request, res: Response) {
    try {
      const { isProject } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Chuyển đổi từ string sang boolean
      const isProjectBool = isProject === "true";

      // Đếm tổng số danh mục theo isProject
      const totalCategories = await Category.countDocuments({
        isProject: isProjectBool,
      });

      // Kiểm tra nếu không tìm thấy kết quả nào
      if (totalCategories === 0) {
        return res.json({
          success: true,
          data: {
            categories: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
            },
          },
        });
      }

      // Tìm tất cả category có isProject = true/false với phân trang
      const categories = await Category.find({ isProject: isProjectBool })
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCategories / limit),
            totalItems: totalCategories,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching categories by isProject:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy tất cả danh mục theo isProject (không phân trang)
  async getAllCategoriesByIsProject(req: Request, res: Response) {
    try {
      const { isProject } = req.params;
      const isProjectBool = isProject === "true";

      const categories = await Category.find({ isProject: isProjectBool }).sort(
        { name: 1 }
      );

      if (categories.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No categories found" });
      }

      res.json({ success: true, data: categories });
    } catch (error) {
      console.error("Error fetching all categories by isProject:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
