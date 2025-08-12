import mongoose, { Document, Schema } from "mongoose";

export interface ICustomerContact extends Document {
  user: mongoose.Types.ObjectId; // Người yêu cầu liên hệ
  post: mongoose.Types.ObjectId; // Bài viết
  contactType: "call_back" | "message" | "view_contact";
  status: "pending" | "contacted" | "deleted";
  notes?: string; // Ghi chú từ người yêu cầu
  adminNotes?: string; // Ghi chú từ admin
  contactedAt?: Date;
  contactedBy?: mongoose.Types.ObjectId; // Người đã liên hệ lại (chủ bài viết)
  deletedAt?: Date; // Thời điểm soft delete
  deletedBy?: mongoose.Types.ObjectId; // Người xóa (user hoặc admin)
  autoDeleteAt?: Date; // Thời điểm auto delete (30 ngày sau deleted)
  createdAt: Date;
  updatedAt: Date;
}

const CustomerContactSchema = new Schema<ICustomerContact>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    contactType: {
      type: String,
      enum: ["call_back", "message", "view_contact"],
      default: "call_back",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "contacted", "deleted"],
      default: "pending",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    contactedAt: {
      type: Date,
    },
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    autoDeleteAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index để tìm kiếm nhanh
CustomerContactSchema.index({ user: 1, post: 1 });
CustomerContactSchema.index({ status: 1 });
CustomerContactSchema.index({ contactType: 1 });
CustomerContactSchema.index({ createdAt: -1 });

// Compound index để prevent duplicate requests từ cùng user cho cùng post
CustomerContactSchema.index(
  { user: 1, post: 1, contactType: 1 },
  { unique: true }
);

export default mongoose.model<ICustomerContact>(
  "CustomerContact",
  CustomerContactSchema
);
