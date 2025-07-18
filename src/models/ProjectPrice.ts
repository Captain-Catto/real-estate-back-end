import mongoose, { Document, Schema } from "mongoose";

export interface IProjectPriceRange extends Document {
  id: string; // ID của khoảng giá dự án
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
  minValue: number; // Giá trị tối thiểu (VND)
  maxValue: number; // Giá trị tối đa (VND), -1 nghĩa là không giới hạn
  order: number; // Thứ tự hiển thị
  isActive: boolean; // Trạng thái hiển thị
}

const ProjectPriceRangeSchema = new Schema<IProjectPriceRange>(
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
ProjectPriceRangeSchema.index({ slug: "text", name: "text" });
ProjectPriceRangeSchema.index({ order: 1 });

// Data mẫu cho giá dự án
export const projectPriceRangeData = [
  {
    id: "project_all",
    name: "Tất cả mức giá",
    slug: "tat-ca",
    minValue: 0,
    maxValue: -1,
    order: 0,
    isActive: true,
  },
  {
    id: "project_1",
    name: "Dưới 1 tỷ",
    slug: "duoi-1-ty",
    minValue: 0,
    maxValue: 1000000000,
    order: 1,
    isActive: true,
  },
  {
    id: "project_2",
    name: "1 - 2 tỷ",
    slug: "1-2-ty",
    minValue: 1000000000,
    maxValue: 2000000000,
    order: 2,
    isActive: true,
  },
  {
    id: "project_3",
    name: "2 - 3 tỷ",
    slug: "2-3-ty",
    minValue: 2000000000,
    maxValue: 3000000000,
    order: 3,
    isActive: true,
  },
  {
    id: "project_4",
    name: "3 - 5 tỷ",
    slug: "3-5-ty",
    minValue: 3000000000,
    maxValue: 5000000000,
    order: 4,
    isActive: true,
  },
  {
    id: "project_5",
    name: "5 - 10 tỷ",
    slug: "5-10-ty",
    minValue: 5000000000,
    maxValue: 10000000000,
    order: 5,
    isActive: true,
  },
  {
    id: "project_6",
    name: "10 - 20 tỷ",
    slug: "10-20-ty",
    minValue: 10000000000,
    maxValue: 20000000000,
    order: 6,
    isActive: true,
  },
  {
    id: "project_7",
    name: "20 - 50 tỷ",
    slug: "20-50-ty",
    minValue: 20000000000,
    maxValue: 50000000000,
    order: 7,
    isActive: true,
  },
  {
    id: "project_8",
    name: "Trên 50 tỷ",
    slug: "tren-50-ty",
    minValue: 50000000000,
    maxValue: -1,
    order: 8,
    isActive: true,
  },
  {
    id: "project_0",
    name: "Thỏa thuận",
    slug: "thoa-thuan",
    minValue: 0,
    maxValue: 0,
    order: 99,
    isActive: true,
  },
];

export const ProjectPriceRange = mongoose.model<IProjectPriceRange>(
  "ProjectPriceRange",
  ProjectPriceRangeSchema
);
