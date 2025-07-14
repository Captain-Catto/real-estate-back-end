import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  type: String; // bán, cho thuê
  title: String;
  description: String;
  price: Number;
  location: {
    province: String;
    district: String;
    ward: String;
    street?: String; // optional
  };
  category: mongoose.Types.ObjectId;
  tags: [String];
  author: { type: mongoose.Schema.Types.ObjectId; ref: "User" };
  images: [String]; // <-- array string
  area: String;
  legalDocs: String;
  furniture: String;
  bedrooms: Number;
  bathrooms: Number;
  floors: Number;
  houseDirection: String;
  balconyDirection: String;
  roadWidth: String;
  frontWidth: String;
  packageId: String;
  packageDuration: Number;
  status: String; // pending, active, rejected, expired, inactive
  priority?: String; // normal, premium, vip
  package?: String; // normal, premium, vip
  views: Number; // post view count
  project?: mongoose.Types.ObjectId; // reference to Project
  createdAt: Date;
  updatedAt: Date;
  // Admin fields
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedReason?: String;
  // Package expiry fields
  expiredAt?: Date; // Ngày hết hạn của post
  originalPackageDuration?: Number; // Lưu duration gốc khi tạo post
  // ... các trường khác
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
      district: { type: String, required: true },
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
      enum: [
        "Đông",
        "Tây",
        "Nam",
        "Bắc",
        "Đông Nam",
        "Tây Nam",
        "Đông Bắc",
        "Tây Bắc",
      ],
    },
    balconyDirection: {
      type: String,
      trim: true,
      enum: [
        "Đông",
        "Tây",
        "Nam",
        "Bắc",
        "Đông Nam",
        "Tây Nam",
        "Đông Bắc",
        "Tây Bắc",
      ],
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
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected", "expired", "inactive"],
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
