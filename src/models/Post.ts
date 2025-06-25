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
  category: String;
  tags: [String];
  author: { type: mongoose.Schema.Types.ObjectId; ref: "User" };
  images: [String]; // <-- array string
  area: String;
  currency: String;
  legalDocs: String;
  furniture: String;
  bedrooms: Number;
  bathrooms: Number;
  floors: Number;
  houseDirection: String;
  balconyDirection: String;
  roadWidth: String;
  frontWidth: String;
  contactName: String;
  email: String;
  phone: String;
  packageId: String;
  packageDuration: Number;
  status: String; // active, inactive, sold
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
    category: {
      type: String,
      required: true,
      enum: ["apartment", "house", "land", "commercial", "other"],
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
      enum: ["pending", "active", "denied", "inactive", "removed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, status: 1 });
postSchema.index({ title: "text", description: "text", content: "text" });

export const Post = mongoose.model<IPost>("Post", postSchema);
