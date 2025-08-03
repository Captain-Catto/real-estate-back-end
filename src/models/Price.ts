import mongoose, { Document, Schema } from "mongoose";

export interface IPriceRange extends Document {
  id: string; // ID của khoảng giá
  name: string; // Tên hiển thị
  slug: string; // Slug cho URL
  type?: string; // Loại khoảng giá (ban/thue)
  minValue?: number; // Giá tối thiểu
  maxValue?: number; // Giá tối đa (-1 = không giới hạn)
  order?: number; // Thứ tự hiển thị
  isActive?: boolean; // Trạng thái hoạt động
}

const PriceRangeSchema = new Schema<IPriceRange>({
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
    enum: ["ban", "cho-thue", "project"],
    default: "ban",
  },
  minValue: {
    type: Number,
    default: 0,
  },
  maxValue: {
    type: Number,
    default: -1, // -1 means unlimited
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Text index cho tìm kiếm
PriceRangeSchema.index({ slug: "text", name: "text" });

// Data mẫu cho giá bán
export const sellPriceRangeData = [
  { id: "all", name: "Tất cả mức giá", slug: "tat-ca", type: "ban" },
  { id: "1", name: "Dưới 500 triệu", slug: "duoi-500-trieu", type: "ban" },
  { id: "2", name: "500 - 800 triệu", slug: "500-800-trieu", type: "ban" },
  { id: "3", name: "800 triệu - 1 tỷ", slug: "800-trieu-1-ty", type: "ban" },
  { id: "4", name: "1 - 2 tỷ", slug: "1-2-ty", type: "ban" },
  { id: "5", name: "2 - 3 tỷ", slug: "2-3-ty", type: "ban" },
  { id: "6", name: "3 - 5 tỷ", slug: "3-5-ty", type: "ban" },
  { id: "7", name: "5 - 7 tỷ", slug: "5-7-ty", type: "ban" },
  { id: "8", name: "7 - 10 tỷ", slug: "7-10-ty", type: "ban" },
  { id: "9", name: "10 - 20 tỷ", slug: "10-20-ty", type: "ban" },
  { id: "10", name: "20 - 30 tỷ", slug: "20-30-ty", type: "ban" },
  { id: "11", name: "30 - 40 tỷ", slug: "30-40-ty", type: "ban" },
  { id: "12", name: "40 - 60 tỷ", slug: "40-60-ty", type: "ban" },
  { id: "13", name: "Trên 60 tỷ", slug: "tren-60-ty", type: "ban" },
  { id: "0", name: "Thỏa thuận", slug: "thoa-thuan", type: "ban" },
];

// Data mẫu cho giá thuê
export const rentPriceRangeData = [
  { id: "all_rent", name: "Tất cả mức giá", slug: "tat-ca", type: "thue" },
  { id: "r1", name: "Dưới 1 triệu", slug: "duoi-1-trieu", type: "thue" },
  { id: "r2", name: "1 - 3 triệu", slug: "1-3-trieu", type: "thue" },
  { id: "r3", name: "3 - 5 triệu", slug: "3-5-trieu", type: "thue" },
  { id: "r4", name: "5 - 10 triệu", slug: "5-10-trieu", type: "thue" },
  { id: "r5", name: "10 - 15 triệu", slug: "10-15-trieu", type: "thue" },
  { id: "r6", name: "15 - 20 triệu", slug: "15-20-trieu", type: "thue" },
  { id: "r7", name: "20 - 30 triệu", slug: "20-30-trieu", type: "thue" },
  { id: "r8", name: "30 - 40 triệu", slug: "30-40-trieu", type: "thue" },
  { id: "r9", name: "40 - 60 triệu", slug: "40-60-trieu", type: "thue" },
  { id: "r10", name: "60 - 80 triệu", slug: "60-80-trieu", type: "thue" },
  { id: "r11", name: "80 - 100 triệu", slug: "80-100-trieu", type: "thue" },
  { id: "r12", name: "Trên 100 triệu", slug: "tren-100-trieu", type: "thue" },
  { id: "r0", name: "Thỏa thuận", slug: "thoa-thuan", type: "thue" },
];

// Data mẫu cho giá dự án
export const projectPriceRangeData = [
  {
    id: "du-an-1",
    name: "Dưới 1 tỷ",
    slug: "du-an-duoi-1-ty",
    type: "project",
  },
  { id: "du-an-2", name: "1-3 tỷ", slug: "du-an-1-3-ty", type: "project" },
  { id: "du-an-3", name: "3-5 tỷ", slug: "du-an-3-5-ty", type: "project" },
  { id: "du-an-4", name: "5-10 tỷ", slug: "du-an-5-10-ty", type: "project" },
  { id: "du-an-5", name: "10-20 tỷ", slug: "du-an-10-20-ty", type: "project" },
  { id: "du-an-6", name: "20-50 tỷ", slug: "du-an-20-50-ty", type: "project" },
  {
    id: "du-an-7",
    name: "Trên 50 tỷ",
    slug: "du-an-tren-50-ty",
    type: "project",
  },
];

export const PriceRange = mongoose.model<IPriceRange>(
  "PriceRange",
  PriceRangeSchema
);

// Function to import project price ranges
export const importProjectPriceRanges = async () => {
  try {
    for (const priceData of projectPriceRangeData) {
      await PriceRange.findOneAndUpdate({ id: priceData.id }, priceData, {
        upsert: true,
        new: true,
      });
    }
    console.log("✅ Project price ranges imported successfully");
  } catch (error) {
    console.error("❌ Error importing project price ranges:", error);
  }
};
