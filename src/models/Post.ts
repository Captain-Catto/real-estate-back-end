import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  title: string;
  description: string;
  content: string;
  price?: number;
  location?: string;
  images: string[];
  category: string;
  tags: string[];
  author: mongoose.Types.ObjectId;
  status: "active" | "inactive" | "sold";
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
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
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
    },
    location: {
      type: String,
      trim: true,
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
      enum: ["active", "inactive", "sold"],
      default: "active",
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
