import { Request, Response } from "express";
import { NewsCategory } from "../models/NewsCategory";
import { News } from "../models/News";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
    username: string;
  };
}

export class NewsCategoryController {
  // GET /api/admin/news-categories - Lấy tất cả danh mục tin tức cho admin
  async getAdminNewsCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await NewsCategory.find().sort({ order: 1 });

      // Lấy số lượng bài viết cho mỗi category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await News.countDocuments({
            category: category.slug,
            status: "published",
          });
          return {
            ...category.toObject(),
            count,
          };
        })
      );

      res.json({
        success: true,
        data: categoriesWithCount,
      });
    } catch (error) {
      console.error("Error fetching news categories:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách danh mục tin tức",
      });
    }
  }

  // GET /api/news/categories - Lấy danh mục tin tức công khai (có count)
  async getPublicNewsCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const categories = await NewsCategory.find({ isActive: true }).sort({
        order: 1,
      });

      // Lấy số lượng bài viết đã publish cho mỗi category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await News.countDocuments({
            category: category.slug,
            status: "published",
          });
          return {
            id: category.slug,
            name: category.name,
            slug: category.slug,
            count,
          };
        })
      );

      res.json({
        success: true,
        data: categoriesWithCount,
      });
    } catch (error) {
      console.error("Error fetching public news categories:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách danh mục tin tức",
      });
    }
  }

  // POST /api/admin/news-categories - Tạo danh mục tin tức mới
  async createNewsCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, slug, description, order, isActive } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: "Tên và slug là bắt buộc",
        });
      }

      // Kiểm tra slug đã tồn tại chưa
      const existingCategory = await NewsCategory.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại",
        });
      }

      // Tạo ID unique
      const categoryId = `news_cat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const category = new NewsCategory({
        id: categoryId,
        name,
        slug,
        description: description || "",
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
      });

      await category.save();

      res.status(201).json({
        success: true,
        message: "Tạo danh mục tin tức thành công",
        data: category,
      });
    } catch (error) {
      console.error("Error creating news category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo danh mục tin tức",
      });
    }
  }

  // PUT /api/admin/news-categories/:id - Cập nhật danh mục tin tức
  async updateNewsCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, description, order, isActive } = req.body;

      const category = await NewsCategory.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục tin tức",
        });
      }

      // Kiểm tra slug đã tồn tại chưa (ngoại trừ danh mục hiện tại)
      if (slug && slug !== category.slug) {
        const existingCategory = await NewsCategory.findOne({ slug });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại",
          });
        }
      }

      // Cập nhật các trường
      if (name !== undefined) category.name = name;
      if (slug !== undefined) {
        // Cập nhật slug trong tất cả bài viết có category này
        await News.updateMany({ category: category.slug }, { category: slug });
        category.slug = slug;
      }
      if (description !== undefined) category.description = description;
      if (order !== undefined) category.order = order;
      if (isActive !== undefined) category.isActive = isActive;

      await category.save();

      res.json({
        success: true,
        message: "Cập nhật danh mục tin tức thành công",
        data: category,
      });
    } catch (error) {
      console.error("Error updating news category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật danh mục tin tức",
      });
    }
  }

  // DELETE /api/admin/news-categories/:id - Xóa danh mục tin tức
  async deleteNewsCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const category = await NewsCategory.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục tin tức",
        });
      }

      // Kiểm tra xem có bài viết nào đang sử dụng category này không
      const newsCount = await News.countDocuments({ category: category.slug });
      if (newsCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Không thể xóa danh mục này vì có ${newsCount} bài viết đang sử dụng`,
        });
      }

      await NewsCategory.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa danh mục tin tức thành công",
      });
    } catch (error) {
      console.error("Error deleting news category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa danh mục tin tức",
      });
    }
  }

  // PUT /api/admin/news-categories/order - Cập nhật thứ tự danh mục tin tức
  async updateNewsCategoriesOrder(req: AuthenticatedRequest, res: Response) {
    try {
      const { orders } = req.body; // Array of { id, order }

      if (!Array.isArray(orders)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu orders phải là một mảng",
        });
      }

      // Cập nhật thứ tự cho từng danh mục
      const updatePromises = orders.map((item: { id: string; order: number }) =>
        NewsCategory.findByIdAndUpdate(item.id, { order: item.order })
      );

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: "Cập nhật thứ tự danh mục tin tức thành công",
      });
    } catch (error) {
      console.error("Error updating news categories order:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thứ tự danh mục tin tức",
      });
    }
  }
}
