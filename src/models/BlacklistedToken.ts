import { Schema, model, Document } from "mongoose";

interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const BlacklistedTokenSchema = new Schema<IBlacklistedToken>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB TTL index để tự động xóa token đã hết hạn
    index: { expireAfterSeconds: 0 },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const BlacklistedToken = model<IBlacklistedToken>(
  "BlacklistedToken",
  BlacklistedTokenSchema
);
export type { IBlacklistedToken };
