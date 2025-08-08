import mongoose, { Document, Schema } from "mongoose";

export interface IPageView extends Document {
  page: string; // URL of the page
  ipAddress: string; // IP address của visitor
  userAgent?: string; // Browser user agent
  referrer?: string; // Trang trước đó
  sessionId?: string; // Session identifier
  userId?: mongoose.Types.ObjectId; // User ID nếu đã đăng nhập
  timestamp: Date;
}

const PageViewSchema = new Schema<IPageView>(
  {
    page: {
      type: String,
      required: true,
      trim: true,
    },
    ipAddress: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    referrer: {
      type: String,
      trim: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // Sử dụng timestamp field thay vì timestamps auto
  }
);

// Indexes for performance
PageViewSchema.index({ page: 1, timestamp: -1 });
PageViewSchema.index({ ipAddress: 1, page: 1, timestamp: -1 });
PageViewSchema.index({ timestamp: -1 });

// Compound index for unique page views per IP per day
PageViewSchema.index(
  {
    ipAddress: 1,
    page: 1,
    timestamp: 1,
  },
  {
    unique: false, // Don't enforce uniqueness, just for performance
  }
);

export const PageView = mongoose.model<IPageView>("PageView", PageViewSchema);
