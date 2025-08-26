import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  type: "ban" | "cho-thue"; // bán, cho thuê
  title: string;
  description: string;
  price: number;
  location: {
    province: string;
    ward: string;
    street?: string; // tuỳ chọn, vì có thể ng dùng ko muốn cung cấp
  };
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  images: string[];
  area: number;
  legalDocs: string;
  furniture: string;
  bedrooms: number;
  bathrooms: number;
  floors?: number;
  houseDirection?: string;
  balconyDirection?: string;
  roadWidth?: string;
  frontWidth?: string;
  packageId?: string;
  packageDuration?: number;
  status:
    | "pending"
    | "active"
    | "rejected"
    | "expired"
    | "inactive"
    | "deleted";
  priority?: "normal" | "premium" | "vip";
  package?: "free" | "basic" | "premium" | "vip";
  views: number; // post view count
  project?: mongoose.Types.ObjectId; // reference to Project
  createdAt: Date;
  updatedAt: Date;
  // Admin fields
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedReason?: string;
  // Package expiry fields
  expiredAt?: Date; // Ngày hết hạn của post
  originalPackageDuration?: number; // Lưu duration gốc khi tạo post
}

const postSchema = new Schema<IPost>(
  {
    type: {
      type: String,
      required: true,
      enum: ["ban", "cho-thue"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    price: {
      type: Number,
      min: 0,
    },
    location: {
      province: { type: String, required: true },
      ward: { type: String, required: true },
      street: { type: String, trim: true },
    },
    images: [
      {
        type: String,
      },
    ],
    area: {
      type: Number,
      trim: true,
    },
    legalDocs: {
      type: String,
      trim: true,
    },
    furniture: {
      type: String,
      trim: true,
    },
    bedrooms: {
      type: Number,
      min: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
    },
    floors: {
      type: Number,
      min: 0,
    },
    houseDirection: {
      type: String,
      trim: true,
      enum: {
        values: [
          "",
          "Đông",
          "Tây",
          "Nam",
          "Bắc",
          "Đông Nam",
          "Tây Nam",
          "Đông Bắc",
          "Tây Bắc",
        ],
        message: "Hướng nhà không hợp lệ",
      },
    },
    balconyDirection: {
      type: String,
      trim: true,
      enum: {
        values: [
          "",
          "Đông",
          "Tây",
          "Nam",
          "Bắc",
          "Đông Nam",
          "Tây Nam",
          "Đông Bắc",
          "Tây Bắc",
        ],
        message: "Hướng ban công không hợp lệ",
      },
    },
    roadWidth: {
      type: String,
      trim: true,
    },
    frontWidth: {
      type: String,
      trim: true,
    },
    packageId: {
      type: String,
      trim: true,
    },
    packageDuration: {
      type: Number,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "expired", "inactive", "deleted"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["normal", "premium", "vip"],
      default: "normal",
    },
    package: {
      type: String,
      enum: ["free", "basic", "premium", "vip"],
      default: "free",
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Admin fields
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rejectedReason: {
      type: String,
      trim: true,
      default: null,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    // Package expiry fields
    expiredAt: {
      type: Date,
      default: null,
      index: true, // Index để query expired posts hiệu quả
    },
    originalPackageDuration: {
      type: Number,
      min: 0,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ title: "text", description: "text" });

export const Post = mongoose.model<IPost>("Post", postSchema);
