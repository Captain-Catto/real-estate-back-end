import { Request, Response } from "express";
import { ProvinceModel, WardModel } from "../models/Location";

export class LocationController {
  // ===== PUBLIC METHODS =====

  // Lấy danh sách tỉnh/thành
  async getProvinces(req: Request, res: Response) {
    console.log("Fetching provinces...");
    try {
      // Sử dụng dữ liệu từ database thay vì JSON files
      const provinces = await ProvinceModel.find(
        {},
        {
          code: 1,
          name: 1,
          type: 1,
          slug: 1,
          name_with_type: 1,
        }
      ).sort({ name: 1 });

      // Transform data để trả về với format mong muốn
      const transformedProvinces = provinces
        .map((province) => ({
          name: province.name,
          code: province.code,
          slug: province.slug,
          type: province.type,
          name_with_type: province.name_with_type,
        }))
        .filter((province) => province.name); // Lọc các tỉnh có dữ liệu đầy đủ

      res.json({ success: true, data: transformedProvinces });
    } catch (error) {
      console.error("Error fetching provinces:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // lấy danh sách tỉnh/thành theo slug (ví dụ: ha-noi)
  async getProvinceBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;

      // Tìm province trong database bằng slug
      const province = await ProvinceModel.findOne({ slug: slug });

      if (!province) {
        return res
          .status(404)
          .json({ success: false, message: "Province not found" });
      }

      res.json({
        success: true,
        data: {
          code: province.code,
          name: province.name,
          slug: province.slug,
          type: province.type,
          name_with_type: province.name_with_type,
        },
      });
    } catch (error) {
      console.error("Error fetching province by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy danh sách phường/xã theo mã tỉnh
  // (phương thức này đã đổi tên từ getDistricts nhưng giữ nguyên để không ảnh hưởng đến API)
  async getDistricts(req: Request, res: Response) {
    try {
      const { provinceCode } = req.params;

      // Kiểm tra nếu tỉnh tồn tại trong database - search by code, slug, or name
      const province = await ProvinceModel.findOne({
        $or: [
          { code: provinceCode },
          { slug: provinceCode },
          { name: provinceCode }, // Add name search
          { name_with_type: provinceCode }, // Also check full name
        ],
      });

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      // Lấy danh sách phường/xã từ database theo province code
      const wards = await WardModel.find({ parent_code: province.code }).sort({
        name: 1,
      });

      // Transform data để trả về với format mong muốn
      const transformedWards = wards.map((ward) => ({
        code: ward.code,
        name: ward.name || "",
        type: ward.type || "",
        slug: ward.slug || "",
        name_with_type: ward.name_with_type || "",
        path: ward.path || "",
        path_with_type: ward.path_with_type || "",
        parent_code: ward.parent_code,
      }));

      res.json({
        success: true,
        data: transformedWards,
      });
    } catch (error) {
      console.error("Error getting wards:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Lấy danh sách phường/xã theo mã tỉnh
  async getWards(req: Request, res: Response) {
    try {
      const { provinceCode } = req.params;

      // Lọc các phường/xã có parent_code là provinceCode từ database
      const wards = await WardModel.find({ parent_code: provinceCode }).sort({
        name: 1,
      });

      // Transform data để trả về với format mong muốn
      const transformedWards = wards.map((ward) => ({
        code: ward.code,
        name: ward.name || "",
        type: ward.type || "",
        slug: ward.slug || "",
        name_with_type: ward.name_with_type || "",
        path: ward.path || "",
        path_with_type: ward.path_with_type || "",
        parent_code: ward.parent_code,
      }));

      res.json({ success: true, data: transformedWards });
    } catch (error) {
      console.error("Error getting wards:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy tên đầy đủ của địa danh dựa trên codes
  async getLocationNames(req: Request, res: Response) {
    try {
      const { provinceCode, wardCode } = req.query;

      console.log("📍 getLocationNames called with:", {
        provinceCode,
        wardCode,
      });

      if (!provinceCode) {
        return res.status(400).json({
          success: false,
          message: "Province code is required",
        });
      }

      // Find province from database - search by code, slug, or name
      const province = await ProvinceModel.findOne({
        $or: [
          { code: provinceCode as string },
          { slug: provinceCode as string },
          { name: provinceCode as string }, // Add name search
          { name_with_type: provinceCode as string }, // Also check full name
        ],
      });

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const result: any = {
        provinceName: province.name,
        provinceCode: province.code,
        provinceType: province.type,
      };

      // Find ward if provided
      if (wardCode) {
        const ward = await WardModel.findOne({ code: wardCode as string });

        if (ward) {
          result.wardName = ward.name || "";
          result.wardCode = wardCode;
          result.wardType = ward.type || "";
        }

        return res.json({
          success: true,
          data: result,
        });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting location names:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin địa điểm theo slug
  async getLocationBySlug(req: Request, res: Response) {
    try {
      const { provinceSlug, wardSlug } = req.params;

      console.log("📍 getLocationBySlug called with:", {
        provinceSlug,
        wardSlug,
      });

      // Tìm province theo slug
      const province = await ProvinceModel.findOne({ slug: provinceSlug });

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found with slug: " + provinceSlug,
        });
      }

      const result: any = {
        provinceName: province.name,
        provinceCode: province.code,
        provinceType: province.type,
        provinceSlug: province.slug,
      };

      // Tìm ward theo slug nếu có
      if (wardSlug) {
        const wards = await WardModel.find({ parent_code: province.code });
        const ward = wards.find((w) => w.slug === wardSlug);

        if (ward) {
          result.wardName = ward.name;
          result.wardCode = ward.code;
          result.wardType = ward.type;
          result.wardSlug = ward.slug;
        } else {
          return res.status(404).json({
            success: false,
            message: "Ward not found with slug: " + wardSlug,
          });
        }
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting location by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy chuỗi địa chỉ đầy đủ
  async getFullAddress(req: Request, res: Response) {
    try {
      const { provinceCode, wardCode, address } = req.query;

      const locationResult = await this.getLocationNamesInternal(
        provinceCode as string,
        wardCode as string
      );

      if (!locationResult.success) {
        return res.status(locationResult.status || 500).json({
          success: false,
          message: locationResult.message,
        });
      }

      const locationData = locationResult.data;
      const locationParts: string[] = [];

      // Add specific address if provided
      if (address) {
        locationParts.push(address as string);
      }

      if (locationData.wardName) locationParts.push(locationData.wardName);
      if (locationData.provinceName)
        locationParts.push(locationData.provinceName);

      res.json({
        success: true,
        data: {
          fullAddress: locationParts.join(", "),
          ...locationData,
        },
      });
    } catch (error) {
      console.error("Error getting full address:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy thông tin breadcrumb đầy đủ từ slug
  async getBreadcrumbFromSlug(req: Request, res: Response) {
    try {
      const { provinceSlug, wardSlug } = req.query;

      if (!provinceSlug) {
        return res.status(400).json({
          success: false,
          message: "Province slug is required",
        });
      }

      console.log("📍 getBreadcrumbFromSlug called with:", {
        provinceSlug,
        wardSlug,
      });

      // Tìm province theo slug
      const province = await ProvinceModel.findOne({
        slug: provinceSlug as string,
      });

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found with slug: " + provinceSlug,
        });
      }

      const result: any = {
        province: {
          name: province.name,
          code: province.code,
          type: province.type,
          slug: province.slug,
          name_with_type: province.name_with_type,
        },
        breadcrumb: [
          {
            name: province.name,
            slug: province.slug,
            type: "province",
          },
        ],
      };

      // Tìm ward theo slug nếu có
      if (wardSlug) {
        const wards = await WardModel.find({ parent_code: province.code });
        const ward = wards.find((w) => w.slug === wardSlug);

        if (ward) {
          result.ward = {
            name: ward.name,
            code: ward.code,
            type: ward.type,
            slug: ward.slug,
            name_with_type: ward.name_with_type,
          };

          // Thêm ward vào breadcrumb
          result.breadcrumb.push({
            name: ward.name,
            slug: ward.slug,
            type: "ward",
          });
        }
      }

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error getting breadcrumb from slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Helper method to get location names internally
  private async getLocationNamesInternal(
    provinceCode?: string,
    wardCode?: string
  ) {
    try {
      if (!provinceCode) {
        return {
          success: false,
          status: 400,
          message: "Province code is required",
        };
      }

      console.log("📍 getLocationNamesInternal called with:", {
        provinceCode,
        wardCode,
      });

      // Find province from database - search by code, slug, or name
      const province = await ProvinceModel.findOne({
        $or: [
          { code: provinceCode },
          { slug: provinceCode },
          { name: provinceCode }, // Add name search
          { name_with_type: provinceCode }, // Also check full name
        ],
      });

      if (!province) {
        return {
          success: false,
          status: 404,
          message: "Province not found",
        };
      }

      const result: any = {
        provinceName: province.name,
        provinceCode: province.code,
        provinceType: province.type,
      };

      // Find ward if provided
      if (wardCode) {
        const ward = await WardModel.findOne({ code: wardCode });

        if (ward) {
          result.wardName = ward.name;
          result.wardCode = wardCode;
          result.wardType = ward.type;
        }
      }

      console.log("📍 getLocationNamesInternal result:", result);

      return { success: true, data: result };
    } catch (error) {
      console.error("Error in getLocationNamesInternal:", error);
      return {
        success: false,
        status: 500,
        message: "Server error",
      };
    }
  }

  // ===== ADMIN CRUD METHODS =====

  // Lấy tất cả provinces (for admin) với wards trực tiếp
  async getProvincesWithChildren(req: Request, res: Response) {
    try {
      const provinces = await ProvinceModel.find({});

      // Lấy tất cả wards và group theo parent_code (province code)
      const wards = await WardModel.find({});

      // Transform data để phù hợp với frontend expectations
      const provincesWithWards = provinces.map((province) => ({
        _id: province._id,
        name: province.name,
        code: province.code,
        codename: province.slug || "",
        division_type: province.type || "province",
        // Thêm các trường từ database
        type: province.type,
        name_with_type: province.name_with_type,
        // Tạo fake districts structure để tương thích với AdminProvince interface
        districts: [
          {
            _id: `${province._id}_default_district`,
            name: `${province.name} - Wards`,
            code: Number(province.code) || 0,
            codename: `${province.slug}_wards` || "",
            division_type: "district",
            short_codename: "",
            wards: wards
              .filter((ward) => ward.parent_code === province.code)
              .map((ward) => ({
                _id: ward._id,
                name: ward.name,
                code: Number(ward.code) || 0,
                codename: ward.slug || "",
                division_type: ward.type || "ward",
                short_codename: ward.slug || "",
              })),
          },
        ],
      }));

      res.json({ success: true, data: provincesWithWards });
    } catch (error) {
      console.error("Error fetching provinces:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Thêm province mới
  async createProvince(req: Request, res: Response) {
    try {
      const { name, code, slug, type, name_with_type } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      // Check if province already exists
      const existingProvince = await ProvinceModel.findOne({
        $or: [{ name }, { code }],
      });

      if (existingProvince) {
        return res.status(400).json({
          success: false,
          message: "Province with this name or code already exists",
        });
      }

      const province = new ProvinceModel({
        name,
        code,
        slug,
        type,
        name_with_type,
      });

      await province.save();

      res.json({ success: true, data: province });
    } catch (error) {
      console.error("Error creating province:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Cập nhật province
  async updateProvince(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, slug, type, name_with_type } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const province = await ProvinceModel.findByIdAndUpdate(
        id,
        { name, code, slug, type, name_with_type },
        { new: true }
      );

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      res.json({ success: true, data: province });
    } catch (error) {
      console.error("Error updating province:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Xóa province
  async deleteProvince(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const province = await ProvinceModel.findByIdAndDelete(id);

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      res.json({ success: true, message: "Province deleted successfully" });
    } catch (error) {
      console.error("Error deleting province:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Thêm ward
  async createWard(req: Request, res: Response) {
    try {
      const { provinceId } = req.params;
      const {
        name,
        code,
        slug,
        type,
        name_with_type,
        path,
        path_with_type,
        parent_code,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      // Get province to determine parent_code
      const province = await ProvinceModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      // Check if ward already exists
      const existingWard = await WardModel.findOne({ code });
      if (existingWard) {
        return res.status(400).json({
          success: false,
          message: "Ward with this code already exists",
        });
      }

      // Create new ward
      const newWard = new WardModel({
        name,
        code,
        slug,
        type,
        name_with_type,
        path,
        path_with_type,
        parent_code: province.code, // Use province code as parent_code
      });

      await newWard.save();

      res.json({ success: true, data: newWard });
    } catch (error) {
      console.error("Error creating ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Cập nhật ward
  async updateWard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        slug,
        type,
        name_with_type,
        path,
        path_with_type,
        parent_code,
      } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const ward = await WardModel.findByIdAndUpdate(
        id,
        {
          name,
          code,
          slug,
          type,
          name_with_type,
          path,
          path_with_type,
          parent_code,
        },
        { new: true }
      );

      if (!ward) {
        return res.status(404).json({
          success: false,
          message: "Ward not found",
        });
      }

      res.json({ success: true, data: ward });
    } catch (error) {
      console.error("Error updating ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Xóa ward
  async deleteWard(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const ward = await WardModel.findByIdAndDelete(id);

      if (!ward) {
        return res.status(404).json({
          success: false,
          message: "Ward not found",
        });
      }

      res.json({ success: true, message: "Ward deleted successfully" });
    } catch (error) {
      console.error("Error deleting ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
