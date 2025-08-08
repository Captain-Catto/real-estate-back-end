import mongoose, { Schema, Document } from "mongoose";

export interface IUserPermission extends Document {
  userId: mongoose.Types.ObjectId;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserPermissionSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IUserPermission>(
  "UserPermission",
  UserPermissionSchema
);
