import mongoose, { Document, Schema } from "mongoose";

export interface IArea extends Document {
  id: string; // ID của khoảng diện tích
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
}

const AreaSchema = new Schema<IArea>({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

// Text index cho tìm kiếm
AreaSchema.index({ slug: "text", name: "text" });

export const Area = mongoose.model<IArea>("Area", AreaSchema);

// Data mẫu cho khoảng diện tích
export const areaRangeData = [
  { id: "all", name: "Tất cả diện tích", slug: "tat-ca" },
  { id: "1", name: "Dưới 30 m²", slug: "duoi-30-m2" },
  { id: "2", name: "30 - 50 m²", slug: "30-50-m2" },
  { id: "3", name: "50 - 80 m²", slug: "50-80-m2" },
  { id: "4", name: "80 - 100 m²", slug: "80-100-m2" },
  { id: "5", name: "100 - 150 m²", slug: "100-150-m2" },
  { id: "6", name: "150 - 200 m²", slug: "150-200-m2" },
  { id: "7", name: "200 - 250 m²", slug: "200-250-m2" },
  { id: "8", name: "250 - 300 m²", slug: "250-300-m2" },
  { id: "9", name: "300 - 500 m²", slug: "300-500-m2" },
  { id: "10", name: "Trên 500 m²", slug: "tren-500-m2" },
];

// Import function để thêm dữ liệu vào DB
export const importAreas = async () => {
  try {
    // Đếm số lượng area range hiện có
    const count = await Area.countDocuments();
    if (count === 0) {
      // Nếu chưa có dữ liệu, thêm mới
      await Area.insertMany(areaRangeData);
      console.log("Area ranges imported successfully");
    } else {
      console.log("Area ranges already exist, skipping import");
    }
  } catch (error) {
    console.error("Error importing area ranges:", error);
  }
};

// Hàm chuyển đổi từ slug khoảng diện tích sang khoảng diện tích thực tế
export const getAreaRangeFromSlug = (
  slug: string
): { min?: number; max?: number } => {
  if (slug === "tat-ca" || !slug) return {};

  switch (slug) {
    case "duoi-30-m2":
      return { max: 30 };
    case "30-50-m2":
      return { min: 30, max: 50 };
    case "50-80-m2":
      return { min: 50, max: 80 };
    case "80-100-m2":
      return { min: 80, max: 100 };
    case "100-150-m2":
      return { min: 100, max: 150 };
    case "150-200-m2":
      return { min: 150, max: 200 };
    case "200-250-m2":
      return { min: 200, max: 250 };
    case "250-300-m2":
      return { min: 250, max: 300 };
    case "300-500-m2":
      return { min: 300, max: 500 };
    case "tren-500-m2":
      return { min: 500 };
    default:
      return {};
  }
};
