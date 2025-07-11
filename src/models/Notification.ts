import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type:
    | "PAYMENT"
    | "POST_APPROVED"
    | "POST_REJECTED"
    | "PACKAGE_PURCHASE"
    | "SYSTEM"
    | "INTEREST";
  read: boolean;
  data?: any; // Additional data related to notification (postId, paymentId, etc.)
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "PAYMENT",
        "POST_APPROVED",
        "POST_REJECTED",
        "PACKAGE_PURCHASE",
        "SYSTEM",
        "INTEREST",
      ],
      required: true,
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ userId: 1, type: 1 });

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
