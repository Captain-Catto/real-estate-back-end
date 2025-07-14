import { Request, Response } from "express";
import { Package } from "../models/Package";
import { AuthenticatedRequest } from "../middleware";

export class PackageController {
  // GET /api/admin/packages - Lấy danh sách tất cả packages (admin only)
  async getAllPackages(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }

      const packages = await Package.find({}).sort({
        displayOrder: 1,
        isPopular: -1,
        priority: 1,
        price: 1,
      });

      res.json({
        success: true,
        data: { packages },
      });
    } catch (error) {
      console.error("Get all packages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // GET /api/packages - Lấy danh sách packages cho user (chỉ active)
  async getActivePackages(req: Request, res: Response) {
    try {
      const packages = await Package.find({ isActive: true }).sort({
        displayOrder: 1,
        isPopular: -1,
        priority: 1,
        price: 1,
      });

      res.json({
        success: true,
        data: { packages },
      });
    } catch (error) {
      console.error("Get active packages error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // POST /api/admin/packages - Tạo package mới (admin only)
  async createPackage(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }

      const {
        name,
        price,
        duration,
        features,
        priority,
        description,
        canPin,
        canHighlight,
        canUseAI,
        supportLevel,
        displayOrder,
        isPopular,
        discountPercentage,
        originalPrice,
      } = req.body;

      // Validate required fields
      if (!name || !price || !duration) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: name, price, duration",
        });
      }

      // Tạo ID tự động từ name (slug format)
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 50);

      // Kiểm tra ID đã tồn tại chưa
      const existingPackage = await Package.findOne({ id });
      if (existingPackage) {
        // Thêm timestamp để tạo ID unique
        const timestamp = Date.now();
        const uniqueId = `${id}-${timestamp}`;

        const packageData = new Package({
          id: uniqueId,
          name,
          price: Number(price),
          duration: Number(duration),
          features: features || [],
          priority: priority || "normal",
          description,
          canPin: canPin || false,
          canHighlight: canHighlight || false,
          canUseAI: canUseAI || false,
          supportLevel: supportLevel || "basic",
          displayOrder: displayOrder || 0,
          isPopular: isPopular || false,
          discountPercentage: discountPercentage || 0,
          originalPrice: originalPrice || 0,
          isActive: true,
        });

        await packageData.save();

        return res.status(201).json({
          success: true,
          message: "Package created successfully",
          data: { package: packageData },
        });
      }

      const packageData = new Package({
        id,
        name,
        price: Number(price),
        duration: Number(duration),
        features: features || [],
        priority: priority || "normal",
        description,
        canPin: canPin || false,
        canHighlight: canHighlight || false,
        canUseAI: canUseAI || false,
        supportLevel: supportLevel || "basic",
        displayOrder: displayOrder || 0,
        isPopular: isPopular || false,
        discountPercentage: discountPercentage || 0,
        originalPrice: originalPrice || 0,
        isActive: true,
      });

      await packageData.save();

      res.status(201).json({
        success: true,
        message: "Package created successfully",
        data: { package: packageData },
      });
    } catch (error) {
      console.error("Create package error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // PUT /api/admin/packages/:id - Cập nhật package (admin only)
  async updatePackage(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }

      const { id } = req.params;
      const {
        name,
        price,
        duration,
        features,
        priority,
        description,
        canPin,
        canHighlight,
        canUseAI,
        supportLevel,
        displayOrder,
        isPopular,
        discountPercentage,
        originalPrice,
        isActive,
      } = req.body;

      const packageData = await Package.findOne({ id });
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }

      // Cập nhật các trường
      if (name !== undefined) packageData.name = name;
      if (price !== undefined) packageData.price = Number(price);
      if (duration !== undefined) packageData.duration = Number(duration);
      if (features !== undefined) packageData.features = features;
      if (priority !== undefined) packageData.priority = priority;
      if (description !== undefined) packageData.description = description;
      if (canPin !== undefined) packageData.canPin = canPin;
      if (canHighlight !== undefined) packageData.canHighlight = canHighlight;
      if (canUseAI !== undefined) packageData.canUseAI = canUseAI;
      if (supportLevel !== undefined) packageData.supportLevel = supportLevel;
      if (displayOrder !== undefined) packageData.displayOrder = displayOrder;
      if (isPopular !== undefined) packageData.isPopular = isPopular;
      if (discountPercentage !== undefined)
        packageData.discountPercentage = discountPercentage;
      if (originalPrice !== undefined)
        packageData.originalPrice = originalPrice;
      if (isActive !== undefined) packageData.isActive = isActive;

      await packageData.save();

      res.json({
        success: true,
        message: "Package updated successfully",
        data: { package: packageData },
      });
    } catch (error) {
      console.error("Update package error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // DELETE /api/admin/packages/:id - Xóa package (admin only)
  async deletePackage(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }

      const { id } = req.params;

      const packageData = await Package.findOne({ id });
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }

      await Package.deleteOne({ id });

      res.json({
        success: true,
        message: "Package deleted successfully",
      });
    } catch (error) {
      console.error("Delete package error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // GET /api/admin/packages/:id - Lấy package theo ID (admin only)
  async getPackageById(req: AuthenticatedRequest, res: Response) {
    try {
      // Kiểm tra quyền admin
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Admin only",
        });
      }

      const { id } = req.params;

      const packageData = await Package.findOne({ id });
      if (!packageData) {
        return res.status(404).json({
          success: false,
          message: "Package not found",
        });
      }

      res.json({
        success: true,
        data: { package: packageData },
      });
    } catch (error) {
      console.error("Get package by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
