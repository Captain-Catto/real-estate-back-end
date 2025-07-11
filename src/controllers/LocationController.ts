import { LocationModel } from "../models/Location";
import { Request, Response } from "express";

export class LocationController {
  // ===== PUBLIC METHODS =====

  // Lấy danh sách tỉnh/thành
  async getProvinces(req: Request, res: Response) {
    console.log("Fetching provinces...");
    try {
      const provinces = await LocationModel.find(
        {},
        { name: 1, code: 1, codename: 1, division_type: 1, phone_code: 1 }
      );
      res.json({ success: true, data: provinces });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // lấy danh sách tỉnh/thành theo slug (ví dụ: thanh_pho_ha_noi)
  async getProvinceBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const province = await LocationModel.findOne({
        $or: [{ slug }, { codename: slug }],
      });

      if (!province) {
        return res
          .status(404)
          .json({ success: false, message: "Province not found" });
      }

      res.json({ success: true, data: province });
    } catch (error) {
      console.error("Error fetching province by slug:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy danh sách quận/huyện theo mã tỉnh
  async getDistricts(req: Request, res: Response) {
    try {
      const { provinceCode } = req.params;

      // Try to find by code first (if it's numeric)
      let province;
      if (!isNaN(Number(provinceCode))) {
        province = await LocationModel.findOne({ code: Number(provinceCode) });
      }

      // If not found or not numeric, try to find by slug
      if (!province) {
        province = await LocationModel.findOne({
          $or: [{ slug: provinceCode }, { codename: provinceCode }],
        });
      }

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      // Map district data to a simpler format
      const districts = province.districts.map((district: any) => ({
        name: district.name,
        code: district.code,
        codename: district.codename,
        division_type: district.division_type,
        short_codename: district.short_codename,
      }));

      res.json({
        success: true,
        data: districts,
      });
    } catch (error) {
      console.error("Error getting districts:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Lấy danh sách phường/xã theo mã tỉnh và mã quận/huyện
  async getWards(req: Request, res: Response) {
    try {
      const { provinceCode, districtCode } = req.params;

      // Try to find by code first (if it's numeric)
      let province;
      if (!isNaN(Number(provinceCode))) {
        province = await LocationModel.findOne({ code: Number(provinceCode) });
      }

      // If not found or not numeric, try to find by slug
      if (!province) {
        province = await LocationModel.findOne({
          $or: [{ slug: provinceCode }, { codename: provinceCode }],
        });
      }

      if (!province) {
        return res
          .status(404)
          .json({ success: false, message: "Province not found" });
      }

      // Try to find district by code first (if it's numeric)
      let district;
      if (!isNaN(Number(districtCode))) {
        district = province.districts.find(
          (d: any) => d.code === Number(districtCode)
        );
      }

      // If not found or not numeric, try to find by slug/codename
      if (!district) {
        district = province.districts.find(
          (d: any) => d.slug === districtCode || d.codename === districtCode
        );
      }

      if (!district) {
        return res
          .status(404)
          .json({ success: false, message: "District not found" });
      }

      // Map ward data to a simpler format
      const wards =
        district.wards?.map((ward: any) => ({
          name: ward.name,
          code: ward.code,
          codename: ward.codename,
          division_type: ward.division_type,
          short_codename: ward.short_codename,
        })) || [];

      res.json({ success: true, data: wards });
    } catch (error) {
      console.error("Error getting wards:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Lấy tên đầy đủ của địa danh dựa trên codes
  async getLocationNames(req: Request, res: Response) {
    try {
      const { provinceCode, districtCode, wardCode } = req.query;

      console.log("📍 getLocationNames called with:", {
        provinceCode,
        districtCode,
        wardCode,
      });

      if (!provinceCode) {
        return res.status(400).json({
          success: false,
          message: "Province code is required",
        });
      }

      // Find province
      let province;
      if (!isNaN(Number(provinceCode))) {
        province = await LocationModel.findOne({ code: Number(provinceCode) });
      }

      if (!province) {
        province = await LocationModel.findOne({
          $or: [{ slug: provinceCode }, { codename: provinceCode }],
        });
      }

      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const result: any = {
        provinceName: province.name,
        provinceCode: province.code,
      };

      // Find district if provided
      if (districtCode) {
        let district;
        if (!isNaN(Number(districtCode))) {
          district = province.districts.find(
            (d: any) => d.code === Number(districtCode)
          );
        }

        if (!district) {
          district = province.districts.find(
            (d: any) => d.slug === districtCode || d.codename === districtCode
          );
        }

        if (district) {
          result.districtName = district.name;
          result.districtCode = district.code;

          // Find ward if provided
          if (wardCode) {
            let ward;
            if (!isNaN(Number(wardCode))) {
              ward = district.wards?.find(
                (w: any) => w.code === Number(wardCode)
              );
            }

            if (!ward) {
              ward = district.wards?.find(
                (w: any) => w.slug === wardCode || w.codename === wardCode
              );
            }

            if (ward) {
              result.wardName = ward.name;
              result.wardCode = ward.code;
            }
          }
        }
      }

      // Build full location name
      const locationParts = [];
      if (result.wardName) locationParts.push(result.wardName);
      if (result.districtName) locationParts.push(result.districtName);
      if (result.provinceName) locationParts.push(result.provinceName);

      result.fullLocationName = locationParts.join(", ");

      console.log("📍 Location names result:", result);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("❌ Error getting location names:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // ===== ADMIN CRUD METHODS =====

  // Lấy tất cả provinces với districts và wards (for admin)
  async getProvincesWithChildren(req: Request, res: Response) {
    try {
      const provinces = await LocationModel.find({}).populate(
        "districts.wards"
      );
      res.json({ success: true, data: provinces });
    } catch (error) {
      console.error("Error fetching provinces with children:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Thêm province mới
  async createProvince(req: Request, res: Response) {
    try {
      const { name, code, codename, division_type, phone_code } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      // Check if province already exists
      const existingProvince = await LocationModel.findOne({
        $or: [{ name }, { codename }, ...(code ? [{ code }] : [])],
      });

      if (existingProvince) {
        return res.status(400).json({
          success: false,
          message: "Province with this name, code, or codename already exists",
        });
      }

      // Generate code if not provided
      let finalCode = code;
      if (!finalCode) {
        const lastProvince = await LocationModel.findOne(
          {},
          {},
          { sort: { code: -1 } }
        );
        finalCode =
          lastProvince && lastProvince.code ? lastProvince.code + 1 : 1;
      }

      const newProvince = new LocationModel({
        name,
        code: finalCode,
        codename,
        division_type: division_type || "province",
        phone_code,
        districts: [],
      });

      await newProvince.save();
      res.json({ success: true, data: newProvince });
    } catch (error) {
      console.error("Error creating province:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Cập nhật province
  async updateProvince(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, codename, division_type, phone_code } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      // Check if another province has the same code, name, or codename
      const existingProvince = await LocationModel.findOne({
        _id: { $ne: id },
        $or: [{ name }, { codename }, ...(code ? [{ code }] : [])],
      });

      if (existingProvince) {
        return res.status(400).json({
          success: false,
          message:
            "Another province with this name, code, or codename already exists",
        });
      }

      const updateData: any = { name, codename };
      if (code !== undefined) updateData.code = code;
      if (division_type) updateData.division_type = division_type;
      if (phone_code !== undefined) updateData.phone_code = phone_code;

      const province = await LocationModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });

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

      const province = await LocationModel.findByIdAndDelete(id);

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

  // Thêm district
  async createDistrict(req: Request, res: Response) {
    try {
      const { provinceId } = req.params;
      const { name, code, codename, division_type, short_codename } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      // Generate code if not provided
      let finalCode = code;
      if (!finalCode) {
        const lastDistrict =
          province.districts.length > 0
            ? province.districts[province.districts.length - 1]
            : null;
        finalCode =
          lastDistrict && lastDistrict.code ? lastDistrict.code + 1 : 1;
      }

      const newDistrict = {
        name,
        code: finalCode,
        codename,
        division_type: division_type || "district",
        short_codename: short_codename || codename,
        wards: [],
      };

      province.districts.push(newDistrict);
      await province.save();

      res.json({ success: true, data: newDistrict });
    } catch (error) {
      console.error("Error creating district:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Cập nhật district
  async updateDistrict(req: Request, res: Response) {
    try {
      const { provinceId, districtId } = req.params;
      const { name, code, codename, division_type, short_codename } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const district = province.districts.id(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: "District not found",
        });
      }

      district.name = name;
      district.codename = codename;
      if (code !== undefined) district.code = code;
      if (division_type) district.division_type = division_type;
      if (short_codename) district.short_codename = short_codename;

      await province.save();

      res.json({ success: true, data: district });
    } catch (error) {
      console.error("Error updating district:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Xóa district
  async deleteDistrict(req: Request, res: Response) {
    try {
      const { provinceId, districtId } = req.params;

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const district = province.districts.id(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: "District not found",
        });
      }

      province.districts.pull(districtId);
      await province.save();

      res.json({ success: true, message: "District deleted successfully" });
    } catch (error) {
      console.error("Error deleting district:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Thêm ward
  async createWard(req: Request, res: Response) {
    try {
      const { provinceId, districtId } = req.params;
      const { name, code, codename, division_type, short_codename } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const district = province.districts.id(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: "District not found",
        });
      }

      // Generate code if not provided
      let finalCode = code;
      if (!finalCode) {
        const lastWard =
          district.wards.length > 0
            ? district.wards[district.wards.length - 1]
            : null;
        finalCode = lastWard && lastWard.code ? lastWard.code + 1 : 1;
      }

      const newWard = {
        name,
        code: finalCode,
        codename,
        division_type: division_type || "ward",
        short_codename: short_codename || codename,
      };

      district.wards.push(newWard);
      await province.save();

      res.json({ success: true, data: newWard });
    } catch (error) {
      console.error("Error creating ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Cập nhật ward
  async updateWard(req: Request, res: Response) {
    try {
      const { provinceId, districtId, wardId } = req.params;
      const { name, code, codename, division_type, short_codename } = req.body;

      if (!name || !codename) {
        return res.status(400).json({
          success: false,
          message: "Name and codename are required",
        });
      }

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const district = province.districts.id(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: "District not found",
        });
      }

      const ward = district.wards.id(wardId);
      if (!ward) {
        return res.status(404).json({
          success: false,
          message: "Ward not found",
        });
      }

      ward.name = name;
      ward.codename = codename;
      if (code !== undefined) ward.code = code;
      if (division_type) ward.division_type = division_type;
      ward.short_codename = short_codename || codename;

      await province.save();

      res.json({ success: true, data: ward });
    } catch (error) {
      console.error("Error updating ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Xóa ward
  async deleteWard(req: Request, res: Response) {
    try {
      const { provinceId, districtId, wardId } = req.params;

      const province = await LocationModel.findById(provinceId);
      if (!province) {
        return res.status(404).json({
          success: false,
          message: "Province not found",
        });
      }

      const district = province.districts.id(districtId);
      if (!district) {
        return res.status(404).json({
          success: false,
          message: "District not found",
        });
      }

      const ward = district.wards.id(wardId);
      if (!ward) {
        return res.status(404).json({
          success: false,
          message: "Ward not found",
        });
      }

      district.wards.pull(wardId);
      await province.save();

      res.json({ success: true, message: "Ward deleted successfully" });
    } catch (error) {
      console.error("Error deleting ward:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
