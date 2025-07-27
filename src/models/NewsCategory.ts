import mongoose, { Document, Schema } from "mongoose";

export interface INewsCategory extends Document {
  id: string;
  name: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NewsCategorySchema = new Schema<INewsCategory>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
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

// Indexes
NewsCategorySchema.index({ slug: 1 });
NewsCategorySchema.index({ order: 1 });
NewsCategorySchema.index({ isActive: 1 });

export const NewsCategory = mongoose.model<INewsCategory>(
  "NewsCategory",
  NewsCategorySchema
);
