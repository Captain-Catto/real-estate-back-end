import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  totalIncome: number;
  totalSpending: number;
  pendingAmount: number; // For payments in processing state
  bonusEarned: number; // Track bonuses earned from promotions
  lastTransaction: Date; // Date of last transaction
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalIncome: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalSpending: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonusEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastTransaction: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Create index on userId for fast lookups
walletSchema.index({ userId: 1 }, { unique: true });

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
