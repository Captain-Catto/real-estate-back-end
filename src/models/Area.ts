import mongoose, { Document, Schema } from "mongoose";

export interface IArea extends Document {
  id: string; // ID của khoảng diện tích
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
  type: string; // Loại: "property" hoặc "project"
  minValue: number; // Giá trị tối thiểu (m²)
  maxValue: number; // Giá trị tối đa (m²), -1 nghĩa là không giới hạn
  order: number; // Thứ tự hiển thị
  isActive: boolean; // Trạng thái hiển thị
}

const AreaSchema = new Schema<IArea>(
  {
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
    type: {
      type: String,
      enum: ["property", "project"],
      default: "property",
    },
    minValue: {
      type: Number,
      required: true,
      default: 0,
    },
    maxValue: {
      type: Number,
      required: true,
      default: -1, // -1 nghĩa là không giới hạn
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index cho tìm kiếm
AreaSchema.index({ slug: "text", name: "text" });
AreaSchema.index({ type: 1, order: 1 });

export const Area = mongoose.model<IArea>("Area", AreaSchema);

// Data mẫu cho khoảng diện tích bất động sản
export const propertyAreaRangeData = [
  {
    id: "property_all",
    name: "Tất cả diện tích",
    slug: "tat-ca",
    type: "property",
    minValue: 0,
    maxValue: -1,
    order: 0,
    isActive: true,
  },
  {
    id: "property_1",
    name: "Dưới 30 m²",
    slug: "duoi-30-m2",
    type: "property",
    minValue: 0,
    maxValue: 30,
    order: 1,
    isActive: true,
  },
  {
    id: "property_2",
    name: "30 - 50 m²",
    slug: "30-50-m2",
    type: "property",
    minValue: 30,
    maxValue: 50,
    order: 2,
    isActive: true,
  },
  {
    id: "property_3",
    name: "50 - 80 m²",
    slug: "50-80-m2",
    type: "property",
    minValue: 50,
    maxValue: 80,
    order: 3,
    isActive: true,
  },
  {
    id: "property_4",
    name: "80 - 100 m²",
    slug: "80-100-m2",
    type: "property",
    minValue: 80,
    maxValue: 100,
    order: 4,
    isActive: true,
  },
  {
    id: "property_5",
    name: "100 - 150 m²",
    slug: "100-150-m2",
    type: "property",
    minValue: 100,
    maxValue: 150,
    order: 5,
    isActive: true,
  },
  {
    id: "property_6",
    name: "150 - 200 m²",
    slug: "150-200-m2",
    type: "property",
    minValue: 150,
    maxValue: 200,
    order: 6,
    isActive: true,
  },
  {
    id: "property_7",
    name: "200 - 250 m²",
    slug: "200-250-m2",
    type: "property",
    minValue: 200,
    maxValue: 250,
    order: 7,
    isActive: true,
  },
  {
    id: "property_8",
    name: "250 - 300 m²",
    slug: "250-300-m2",
    type: "property",
    minValue: 250,
    maxValue: 300,
    order: 8,
    isActive: true,
  },
  {
    id: "property_9",
    name: "300 - 500 m²",
    slug: "300-500-m2",
    type: "property",
    minValue: 300,
    maxValue: 500,
    order: 9,
    isActive: true,
  },
  {
    id: "property_10",
    name: "Trên 500 m²",
    slug: "tren-500-m2",
    type: "property",
    minValue: 500,
    maxValue: -1,
    order: 10,
    isActive: true,
  },
];

// Data mẫu cho khoảng diện tích dự án
export const projectAreaRangeData = [
  {
    id: "project_area_all",
    name: "Tất cả diện tích",
    slug: "tat-ca",
    type: "project",
    minValue: 0,
    maxValue: -1,
    order: 0,
    isActive: true,
  },
  {
    id: "project_area_1",
    name: "Dưới 1.000 m²",
    slug: "duoi-1000-m2",
    type: "project",
    minValue: 0,
    maxValue: 1000,
    order: 1,
    isActive: true,
  },
  {
    id: "project_area_2",
    name: "1.000 - 5.000 m²",
    slug: "1000-5000-m2",
    type: "project",
    minValue: 1000,
    maxValue: 5000,
    order: 2,
    isActive: true,
  },
  {
    id: "project_area_3",
    name: "5.000 - 10.000 m²",
    slug: "5000-10000-m2",
    type: "project",
    minValue: 5000,
    maxValue: 10000,
    order: 3,
    isActive: true,
  },
  {
    id: "project_area_4",
    name: "10.000 - 50.000 m²",
    slug: "10000-50000-m2",
    type: "project",
    minValue: 10000,
    maxValue: 50000,
    order: 4,
    isActive: true,
  },
  {
    id: "project_area_5",
    name: "50.000 - 100.000 m²",
    slug: "50000-100000-m2",
    type: "project",
    minValue: 50000,
    maxValue: 100000,
    order: 5,
    isActive: true,
  },
  {
    id: "project_area_6",
    name: "Trên 100.000 m²",
    slug: "tren-100000-m2",
    type: "project",
    minValue: 100000,
    maxValue: -1,
    order: 6,
    isActive: true,
  },
];

// Import function để thêm dữ liệu vào DB
export const importAreas = async () => {
  try {
    // Đếm số lượng area range hiện có
    const count = await Area.countDocuments();
    if (count === 0) {
      // Nếu chưa có dữ liệu, thêm mới dữ liệu cho cả property và project
      await Area.insertMany([
        ...propertyAreaRangeData,
        ...projectAreaRangeData,
      ]);
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
