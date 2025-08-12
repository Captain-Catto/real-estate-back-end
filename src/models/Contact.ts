import mongoose, { Document, Schema } from "mongoose";

export interface IContact extends Document {
  _id: string;
  senderId: string;
  receiverId: string;
  postId?: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  status: "pending" | "responded" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    senderId: {
      type: String,
      required: false, // Allow anonymous contacts
    },
    receiverId: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: false,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "responded", "closed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ContactSchema.index({ receiverId: 1, createdAt: -1 });
ContactSchema.index({ senderId: 1 });
ContactSchema.index({ postId: 1 });
ContactSchema.index({ status: 1 });

export const Contact = mongoose.model<IContact>("Contact", ContactSchema);
