import mongoose, { Document, Schema } from "mongoose";

export interface IDeveloper extends Document {
  name: string;
  logo: string;
  phone: string;
  email: string;
  website?: string;
  address?: string;
  description?: string;
  foundedYear?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeveloperSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    logo: {
      type: String,
      required: false,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    foundedYear: {
      type: Number,
      required: false,
      min: 1900,
      max: new Date().getFullYear(),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
DeveloperSchema.index({ name: "text", description: "text" });

export const Developer = mongoose.model<IDeveloper>(
  "Developer",
  DeveloperSchema
);
