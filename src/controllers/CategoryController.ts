import { Category } from "../models";
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware";

export class CategoryController {
  // Lấy danh sách danh mục với phân trang
  async getCategories(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limitParam = req.query.limit as string;
      const limit = limitParam === "all" ? null : parseInt(limitParam) || 10;
      const skip = limit ? (page - 1) * limit : 0;

      // Lấy filter từ query params
      const filter: any = {};

      // Nếu có tham số isProject trong query
      if (req.query.isProject !== undefined) {
        filter.isProject = req.query.isProject === "true";
      }

      // Nếu có tham số status trong query
      if (req.query.status) {
        filter.isActive = req.query.status === "active";
        console.log(
          `🔍 Filtering categories by status: ${req.query.status} (isActive: ${filter.isActive})`
        );
      }

      console.log(`🔍 Category filter:`, filter);

      // Đếm tổng số danh mục theo filter
      const totalCategories = await Category.countDocuments(filter);

      // Lấy danh sách danh mục với phân trang (hoặc tất cả nếu limit=all)
      let query = Category.find(filter, { __v: 0 }).sort({ order: 1, name: 1 });

      if (limit) {
        query = query.skip(skip).limit(limit);
      }

      const categories = await query;

      res.json({
        success: true,
        data: {
          categories,
          pagination: {
            currentPage: page,
            totalPages: limit ? Math.ceil(totalCategories / limit) : 1,
            totalItems: totalCategories,
            itemsPerPage: limit || totalCategories,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin chi tiết danh mục theo ID
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      }

      res.json({ success: true, data: category });
    } catch (error) {
      console.error("Error fetching category by ID:", error);
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
      const { status } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      // Chuyển đổi từ string sang boolean
      const isProjectBool = isProject === "true";

      // Build filter object
      const filter: any = { isProject: isProjectBool };

      // Add status filter if provided
      if (status) {
        filter.isActive = status === "active";
        console.log(
          `🔍 getCategoryByIsProject: Filtering categories by status: ${status} (isActive: ${filter.isActive})`
        );
      }

      console.log(`🔍 getCategoryByIsProject filter:`, filter);

      // Đếm tổng số danh mục theo filter
      const totalCategories = await Category.countDocuments(filter);

      console.log(
        `📋 getCategoryByIsProject: Found ${totalCategories} categories with filter`
      );

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

      // Tìm tất cả category theo filter với phân trang
      const categories = await Category.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      console.log(
        `📋 getCategoryByIsProject: Returning ${categories.length} categories after filtering`
      );
      categories.forEach((cat) => {
        console.log(
          `  - ${cat.name} (${cat.slug}) - isActive: ${cat.isActive}`
        );
      });

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
      const { status } = req.query;
      const isProjectBool = isProject === "true";

      // Build filter object
      const filter: any = { isProject: isProjectBool };

      // Add status filter if provided
      if (status) {
        filter.isActive = status === "active";
        console.log(
          `🔍 Filtering categories by status: ${status} (isActive: ${filter.isActive})`
        );
      }

      console.log(`🔍 Category filter:`, filter);

      const categories = await Category.find(filter).sort({ name: 1 });

      console.log(
        `📋 Found ${categories.length} categories with filter:`,
        filter
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

  // ==================== ADMIN METHODS ====================

  // GET /api/admin/categories - Lấy tất cả danh mục cho admin
  async getAdminCategories(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Lấy tất cả categories và sắp xếp theo order, sau đó theo name
      const categories = await Category.find({})
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .select("-__v");

      const totalCategories = await Category.countDocuments({});

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
      console.error("Error fetching admin categories:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách danh mục",
      });
    }
  }

  // POST /api/admin/categories - Tạo danh mục mới
  async createCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, slug, isProject, order, isActive, description } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!name || !slug) {
        return res.status(400).json({
          success: false,
          message: "Tên và slug là bắt buộc",
        });
      }

      // Kiểm tra slug đã tồn tại chưa
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại",
        });
      }

      // Tạo ID unique
      const categoryId = `cat_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const category = new Category({
        id: categoryId,
        name,
        slug,
        isProject: isProject || false,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true,
        description: description || "",
      });

      await category.save();

      res.status(201).json({
        success: true,
        message: "Tạo danh mục thành công",
        data: category,
      });
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo danh mục",
      });
    }
  }

  // PUT /api/admin/categories/:id - Cập nhật danh mục
  async updateCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, isProject, order, isActive, description } = req.body;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục",
        });
      }

      // Kiểm tra slug đã tồn tại chưa (ngoại trừ danh mục hiện tại)
      if (slug && slug !== category.slug) {
        const existingCategory = await Category.findOne({ slug });
        if (existingCategory) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại",
          });
        }
      }

      // Cập nhật các trường
      if (name !== undefined) category.name = name;
      if (slug !== undefined) category.slug = slug;
      if (isProject !== undefined) category.isProject = isProject;
      if (order !== undefined) category.order = order;
      if (isActive !== undefined) category.isActive = isActive;
      if (description !== undefined) category.description = description;

      await category.save();

      res.json({
        success: true,
        message: "Cập nhật danh mục thành công",
        data: category,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật danh mục",
      });
    }
  }

  // DELETE /api/admin/categories/:id - Xóa danh mục
  async deleteCategory(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy danh mục",
        });
      }

      // TODO: Kiểm tra xem có bài đăng nào đang sử dụng danh mục này không
      // const postsUsingCategory = await Post.countDocuments({ category: category.slug });
      // if (postsUsingCategory > 0) {
      //   return res.status(400).json({
      //     success: false,
      //     message: `Không thể xóa danh mục đang được sử dụng bởi ${postsUsingCategory} bài đăng`,
      //   });
      // }

      await Category.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Xóa danh mục thành công",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa danh mục",
      });
    }
  }

  // PUT /api/admin/categories/order - Cập nhật thứ tự danh mục
  async updateCategoriesOrder(req: AuthenticatedRequest, res: Response) {
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
        Category.findByIdAndUpdate(item.id, { order: item.order })
      );

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: "Cập nhật thứ tự danh mục thành công",
      });
    } catch (error) {
      console.error("Error updating categories order:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thứ tự danh mục",
      });
    }
  }
}
