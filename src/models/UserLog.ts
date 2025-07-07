import mongoose, { Schema, Document } from "mongoose";

export interface IUserLog extends Document {
  userId: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  action: "created" | "updated" | "statusChanged" | "deleted";
  changes: Record<string, { from: any; to: any }>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: ["created", "updated", "statusChanged", "deleted"],
      required: true,
    },
    changes: {
      type: Schema.Types.Mixed,
      required: true,
    },
    details: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserLogSchema.index({ userId: 1, createdAt: -1 });
UserLogSchema.index({ changedBy: 1, createdAt: -1 });

export default mongoose.model<IUserLog>("UserLog", UserLogSchema);
