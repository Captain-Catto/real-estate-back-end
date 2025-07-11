import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  id: string; // ID của category
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
  isProject?: boolean; // Có phải là dự án không
  order?: number; // Thứ tự hiển thị
  isActive?: boolean; // Trạng thái hiển thị
  description?: string; // Mô tả danh mục
}

const CategorySchema = new Schema<ICategory>(
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
    isProject: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Thêm createdAt và updatedAt
  }
);

// Text index cho tìm kiếm
CategorySchema.index({ slug: "text", name: "text" });

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
