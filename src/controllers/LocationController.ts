import { LocationModel } from "../models/Location";
import { Request, Response } from "express";

export class LocationController {
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
      const province = await LocationModel.findOne({
        code: Number(provinceCode),
      });
      if (!province) {
        return res
          .status(404)
          .json({ success: false, message: "Province not found" });
      }
      const district = province.districts.find(
        (d: any) => d.code === Number(districtCode)
      );
      if (!district) {
        return res
          .status(404)
          .json({ success: false, message: "District not found" });
      }
      res.json({ success: true, data: district.wards || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}
