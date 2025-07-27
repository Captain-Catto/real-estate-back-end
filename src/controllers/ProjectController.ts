import { Request, Response } from "express";
import { Project, IProject } from "../models/Project";
import { AuthenticatedRequest } from "../middleware";

export class ProjectController {
  // Get all projects with pagination and filters (public access)
  async getProjects(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Filter by developer
      if (req.query.developer) {
        filter["developer.name"] = {
          $regex: req.query.developer,
          $options: "i",
        };
      }

      // Filter by location codes (prioritized over fullLocation)
      if (req.query.provinceCode) {
        filter["location.provinceCode"] = req.query.provinceCode;
        console.log("📍 Filtering by province:", req.query.provinceCode);
      }

      if (req.query.wardCode) {
        filter["location.wardCode"] = req.query.wardCode;
        console.log("🏠 Filtering by ward:", req.query.wardCode);
      }

      // Filter by location text (fallback if no location codes provided)
      if (
        req.query.location &&
        !req.query.provinceCode &&
        !req.query.wardCode
      ) {
        filter.fullLocation = { $regex: req.query.location, $options: "i" };
      }

      // Search by name or description
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      // Count total projects
      const totalProjects = await Project.countDocuments(filter);

      // Get projects with pagination
      const projects = await Project.find(filter)
        .select("-__v")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalProjects / limit),
            totalItems: totalProjects,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách dự án",
      });
    }
  }

  // Get project by ID (public access)
  async getProjectById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const project = await Project.findById(id).select("-__v");

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Error fetching project by ID:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thông tin dự án",
      });
    }
  }

  // Get project by slug (public access)
  async getProjectBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const project = await Project.findOne({ slug }).select("-__v");

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        data: project,
      });
    } catch (error) {
      console.error("Error fetching project by slug:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thông tin dự án",
      });
    }
  }

  // ===== ADMIN METHODS =====

  // Get all projects for admin (with more detailed info)
  async getAdminProjects(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Search by name or description
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      // Count total projects
      const totalProjects = await Project.countDocuments(filter);

      // Get projects with pagination
      const projects = await Project.find(filter)
        .select(
          "_id name slug address location developer status totalUnits area priceRange createdAt updatedAt"
        )
        .populate("developer", "name logo")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          projects,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalProjects / limit),
            totalItems: totalProjects,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin projects:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách dự án",
      });
    }
  }

  // Create new project (admin only)
  async createProject(req: AuthenticatedRequest, res: Response) {
    try {
      const projectData = req.body;

      // Validate required location codes
      if (!projectData.location || !projectData.location.provinceCode) {
        return res.status(400).json({
          success: false,
          message: "Mã tỉnh/thành phố là bắt buộc",
        });
      }

      // Check if slug already exists
      const existingProject = await Project.findOne({ slug: projectData.slug });
      if (existingProject) {
        return res.status(400).json({
          success: false,
          message: "Slug đã tồn tại, vui lòng chọn slug khác",
        });
      }

      // Create new project
      const project = new Project(projectData);
      await project.save();

      res.status(201).json({
        success: true,
        message: "Dự án đã được tạo thành công",
        data: project,
      });
    } catch (error: any) {
      console.error("Error creating project:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tạo dự án",
      });
    }
  }

  // Update project (admin only)
  async updateProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if project exists
      const existingProject = await Project.findById(id);
      if (!existingProject) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      // Validate location codes if being updated
      if (updateData.location) {
        if (!updateData.location.provinceCode) {
          return res.status(400).json({
            success: false,
            message: "Mã tỉnh/thành phố là bắt buộc",
          });
        }
      }

      // If slug is being updated, check if new slug already exists
      if (updateData.slug && updateData.slug !== existingProject.slug) {
        const slugExists = await Project.findOne({
          slug: updateData.slug,
          _id: { $ne: id },
        });
        if (slugExists) {
          return res.status(400).json({
            success: false,
            message: "Slug đã tồn tại, vui lòng chọn slug khác",
          });
        }
      }

      // Update project
      const updatedProject = await Project.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).select("-__v");

      res.json({
        success: true,
        message: "Dự án đã được cập nhật thành công",
        data: updatedProject,
      });
    } catch (error: any) {
      console.error("Error updating project:", error);

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật dự án",
      });
    }
  }

  // Delete project (admin only)
  async deleteProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const project = await Project.findByIdAndDelete(id);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy dự án",
        });
      }

      res.json({
        success: true,
        message: "Dự án đã được xóa thành công",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi xóa dự án",
      });
    }
  }

  // Get project statistics (admin only)
  async getProjectStats(req: AuthenticatedRequest, res: Response) {
    try {
      const totalProjects = await Project.countDocuments();
      const projectsByStatus = await Project.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const recentProjects = await Project.find()
        .select("name status createdAt")
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          totalProjects,
          projectsByStatus,
          recentProjects,
        },
      });
    } catch (error) {
      console.error("Error fetching project stats:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thống kê dự án",
      });
    }
  }

  // Get projects for dropdown selection (simplified response)
  async getProjectsForSelection(req: Request, res: Response) {
    try {
      console.log("🔍 Getting projects for selection with query:", req.query);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by status - only apply if status is not 'all'
      if (req.query.status && req.query.status !== "all") {
        filter.status = req.query.status;
        console.log("🏷️ Filtering by status:", req.query.status);
      } else if (!req.query.status) {
        // Default behavior - only show active projects if no status specified
        filter.$or = [
          { status: "active" },
          { status: "Đang bán" },
          { status: "Sắp mở bán" },
        ];
        console.log("🏷️ Using default status filter (active projects only)");
      } else {
        console.log("🏷️ Getting ALL projects regardless of status");
      }

      // Filter by location codes if provided
      if (req.query.provinceCode) {
        filter["location.provinceCode"] = req.query.provinceCode;
        console.log("📍 Filtering by province:", req.query.provinceCode);
      }

      // Filter by ward code if provided
      if (req.query.wardCode) {
        filter["location.wardCode"] = req.query.wardCode;
        console.log("🏠 Filtering by ward:", req.query.wardCode);
      }

      // Filter by category if provided
      if (req.query.categoryId) {
        filter.category = req.query.categoryId;
        console.log("🏷️ Filtering by category:", req.query.categoryId);
      }

      // Search by name or address if provided
      if (req.query.search) {
        const searchTerm = req.query.search as string;
        const searchFilter = {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { address: { $regex: searchTerm, $options: "i" } },
          ],
        };

        // If we already have filters, combine them with $and
        if (Object.keys(filter).length > 0) {
          filter.$and = [
            // Preserve existing filters
            { ...filter },
            // Add search filter
            searchFilter,
          ];

          // Clean up the original filter properties that are now in $and
          Object.keys(filter).forEach((key) => {
            if (key !== "$and") {
              delete filter[key];
            }
          });
        } else {
          // If no existing filters, just add the search filter
          Object.assign(filter, searchFilter);
        }

        console.log("🔍 Searching for:", searchTerm);
      }

      console.log("🔍 Final filter:", JSON.stringify(filter, null, 2));

      // Count total projects matching filter
      const totalProjects = await Project.countDocuments(filter);

      // Get projects with essential fields and pagination
      const projects = await Project.find(filter)
        .select("_id name address location developer.name status category")
        .populate("category", "_id name isProject")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      console.log(
        `✅ Found ${projects.length} projects (page ${page}/${Math.ceil(
          totalProjects / limit
        )})`
      );

      // Transform projects to include fullLocation
      const transformedProjects = projects.map((project) => ({
        _id: project._id,
        name: project.name,
        address: project.address,
        fullLocation: project.address || "Địa chỉ chưa cập nhật",
        location: project.location,
        category: project.category,
      }));

      // Return with pagination info if requested, otherwise return array for backward compatibility
      if (req.query.includePagination === "true") {
        res.json({
          success: true,
          data: {
            projects: transformedProjects,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(totalProjects / limit),
              totalItems: totalProjects,
              itemsPerPage: limit,
              hasMore: page < Math.ceil(totalProjects / limit),
            },
          },
        });
      } else {
        // Backward compatibility - return array directly
        res.json(transformedProjects);
      }
    } catch (error) {
      console.error("❌ Error getting projects for selection:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách dự án",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
