import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new Schema<IFavorite>(
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
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one user can only favorite a post once
favoriteSchema.index({ user: 1, post: 1 }, { unique: true });

// Index for efficient queries
favoriteSchema.index({ user: 1, createdAt: -1 });

export const Favorite = mongoose.model<IFavorite>("Favorite", favoriteSchema);
