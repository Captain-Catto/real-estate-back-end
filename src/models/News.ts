import mongoose, { Document, Schema } from "mongoose";

export interface INews extends Document {
  title: string;
  slug: string;
  content: string;
  featuredImage?: string;
  category: "mua-ban" | "cho-thue" | "tai-chinh" | "phong-thuy" | "tong-hop";
  author: mongoose.Types.ObjectId;
  moderatedBy?: mongoose.Types.ObjectId;
  status: "draft" | "pending" | "published" | "unpublished" | "rejected";
  publishedAt?: Date;
  unpublishedAt?: Date;
  unpublishReason?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  views: number;
  readTime: number; // in minutes
  isHot: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true,
    },
    featuredImage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["mua-ban", "cho-thue", "tai-chinh", "phong-thuy", "tong-hop"],
      required: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "unpublished", "rejected"],
      default: "draft",
      index: true,
    },
    publishedAt: {
      type: Date,
      index: true,
    },
    unpublishedAt: {
      type: Date,
      index: true,
    },
    unpublishReason: {
      type: String,
    },
    rejectedAt: {
      type: Date,
      index: true,
    },
    rejectionReason: {
      type: String,
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
    },
    readTime: {
      type: Number,
      default: 1,
      min: 1,
    },
    isHot: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
NewsSchema.index({
  title: "text",
  content: "text",
  excerpt: "text",
  tags: "text",
});

// Compound indexes for efficient queries
NewsSchema.index({ status: 1, publishedAt: -1 });
NewsSchema.index({ category: 1, status: 1, publishedAt: -1 });
NewsSchema.index({ author: 1, status: 1, createdAt: -1 });
NewsSchema.index({ isHot: 1, publishedAt: -1 });
NewsSchema.index({ isFeatured: 1, publishedAt: -1 });

// Pre-save middleware to auto-generate slug
NewsSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  // Auto-calculate read time based on content length
  if (this.isModified("content")) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // Set publishedAt when status changes to published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

export const News = mongoose.model<INews>("News", NewsSchema);
