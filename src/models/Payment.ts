import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  postId?: mongoose.Types.ObjectId;
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: "vnpay" | "momo" | "paypal" | "bank_transfer" | "wallet";
  status: "pending" | "completed" | "failed" | "cancelled";
  transactionId?: string;
  vnpayTransactionRef?: string;
  description: string;
  paymentUrl?: string;
  returnUrl?: string;
  ipnUrl?: string;
  paymentDate?: Date;
  completedAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  walletProcessed?: boolean; // Flag to prevent duplicate wallet processing
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: false,
    },
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "VND",
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "paypal", "bank_transfer", "wallet"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    transactionId: {
      type: String,
      sparse: true,
    },
    vnpayTransactionRef: {
      type: String,
      sparse: true,
    },
    description: {
      type: String,
      required: true,
    },
    paymentUrl: {
      type: String,
    },
    returnUrl: {
      type: String,
    },
    ipnUrl: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    failedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
    },
    walletProcessed: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ vnpayTransactionRef: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
