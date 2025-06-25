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

  // Lấy danh sách quận/huyện theo mã tỉnh
  async getDistricts(req: Request, res: Response) {
    try {
      const { provinceCode } = req.params;
      const province = await LocationModel.findOne({
        code: Number(provinceCode),
      });
      if (!province) {
        return res
          .status(404)
          .json({ success: false, message: "Province not found" });
      }
      res.json({ success: true, data: province.districts || [] });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
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
