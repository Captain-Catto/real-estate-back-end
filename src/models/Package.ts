import mongoose, { Document, Schema } from "mongoose";

export interface IPackage extends Document {
  id: string;
  name: string;
  price: number;
  duration: number; // Số ngày hiệu lực
  features: string[];
  isActive: boolean;
  priority: "normal" | "premium" | "vip";
  description?: string;
  canPin?: boolean; // Có thể ghim bài không
  canHighlight?: boolean; // Có thể làm nổi bật không
  canUseAI?: boolean; // Có thể sử dụng AI không
  supportLevel?: "basic" | "standard" | "premium"; // Mức độ hỗ trợ
  displayOrder?: number; // Thứ tự hiển thị
  isPopular?: boolean; // Đánh dấu là gói phổ biến
  discountPercentage?: number; // Phần trăm giảm giá
  originalPrice?: number; // Giá gốc trước khi giảm
  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["normal", "premium", "vip"],
      default: "normal",
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    canPin: {
      type: Boolean,
      default: false,
    },
    canHighlight: {
      type: Boolean,
      default: false,
    },
    canUseAI: {
      type: Boolean,
      default: false,
    },
    supportLevel: {
      type: String,
      enum: ["basic", "standard", "premium"],
      default: "basic",
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
packageSchema.index({ isActive: 1, displayOrder: 1, priority: 1 });
packageSchema.index({ price: 1 });
packageSchema.index({ isPopular: -1 });

export const Package = mongoose.model<IPackage>("Package", packageSchema);
