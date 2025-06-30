import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  id: string; // ID của category
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
  isProject?: boolean; // Có phải là dự án không
}

const CategorySchema = new Schema<ICategory>({
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
});

// Text index cho tìm kiếm
CategorySchema.index({ slug: "text", name: "text" });

export const Category = mongoose.model<ICategory>("Category", CategorySchema);
