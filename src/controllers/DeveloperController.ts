import { Request, Response } from "express";
import { Developer, IDeveloper } from "../models/Developer";
import { AuthenticatedRequest } from "../middleware";

export class DeveloperController {
  // Get all developers (public access for selection)
  async getDevelopers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = { isActive: true };

      // Search by name
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      // Count total developers
      const totalDevelopers = await Developer.countDocuments(filter);

      // Get developers with pagination
      const developers = await Developer.find(filter)
        .select("_id name logo phone email website foundedYear")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          developers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalDevelopers / limit),
            totalItems: totalDevelopers,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching developers:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách chủ đầu tư",
      });
    }
  }

  // Get all developers for admin listing
  async getAdminDevelopers(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter: any = {};

      // Filter by active status
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === "true";
      }

      // Search by name or description
      if (req.query.search) {
        filter.$text = { $search: req.query.search };
      }

      // Count total developers
      const totalDevelopers = await Developer.countDocuments(filter);

      // Get developers with pagination
      const developers = await Developer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        data: {
          developers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalDevelopers / limit),
            totalItems: totalDevelopers,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching admin developers:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy danh sách chủ đầu tư",
      });
    }
  }

  // Get developer by ID
  async getDeveloperById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const developer = await Developer.findById(id);

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chủ đầu tư",
        });
      }

      res.json({
        success: true,
        data: developer,
      });
    } catch (error) {
      console.error("Error fetching developer by ID:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi lấy thông tin chủ đầu tư",
      });
    }
  }

  // Create new developer (admin only)
  async createDeveloper(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        name,
        logo,
        phone,
        email,
        website,
        address,
        description,
        foundedYear,
      } = req.body;

      // Check if developer with same name already exists
      const existingDeveloper = await Developer.findOne({ name });
      if (existingDeveloper) {
        return res.status(400).json({
          success: false,
          message: "Chủ đầu tư với tên này đã tồn tại",
        });
      }

      const developer = new Developer({
        name,
        logo,
        phone,
        email,
        website,
        address,
        description,
        foundedYear,
        isActive: true,
      });

      await developer.save();

      res.status(201).json({
        success: true,
        data: developer,
        message: "Tạo chủ đầu tư thành công",
      });
    } catch (error) {
      console.error("Error creating developer:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi tạo chủ đầu tư",
      });
    }
  }

  // Update developer (admin only)
  async updateDeveloper(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        logo,
        phone,
        email,
        website,
        address,
        description,
        foundedYear,
        isActive,
      } = req.body;

      // Check if another developer with same name exists
      const existingDeveloper = await Developer.findOne({
        name,
        _id: { $ne: id },
      });
      if (existingDeveloper) {
        return res.status(400).json({
          success: false,
          message: "Chủ đầu tư với tên này đã tồn tại",
        });
      }

      const developer = await Developer.findByIdAndUpdate(
        id,
        {
          name,
          logo,
          phone,
          email,
          website,
          address,
          description,
          foundedYear,
          isActive,
        },
        { new: true, runValidators: true }
      );

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chủ đầu tư",
        });
      }

      res.json({
        success: true,
        data: developer,
        message: "Cập nhật chủ đầu tư thành công",
      });
    } catch (error) {
      console.error("Error updating developer:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi cập nhật chủ đầu tư",
      });
    }
  }

  // Delete developer (admin only)
  async deleteDeveloper(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Soft delete by setting isActive to false
      const developer = await Developer.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy chủ đầu tư",
        });
      }

      res.json({
        success: true,
        message: "Xóa chủ đầu tư thành công",
      });
    } catch (error) {
      console.error("Error deleting developer:", error);
      res.status(500).json({
        success: false,
        message: "Có lỗi xảy ra khi xóa chủ đầu tư",
      });
    }
  }

  // Get simple list for selection dropdown
  async getDevelopersForSelection(req: Request, res: Response) {
    try {
      const developers = await Developer.find({ isActive: true })
        .select("_id name logo phone email")
        .sort({ name: 1 });

      res.json(developers);
    } catch (error) {
      console.error("Error getting developers for selection:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách chủ đầu tư",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}
