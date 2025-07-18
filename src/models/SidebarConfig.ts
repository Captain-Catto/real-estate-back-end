import mongoose, { Document, Schema } from "mongoose";

export interface ISidebarMenuItem {
  id: string;
  name: string;
  href: string;
  icon: string;
  order: number;
  isVisible: boolean;
  roles: ("admin" | "employee")[];
}

export interface ISidebarConfig extends Document {
  userId?: mongoose.Types.ObjectId; // Optional: for user-specific configs
  menuItems: ISidebarMenuItem[];
  isDefault: boolean; // True for system default config
  role: "admin" | "employee" | "global";
  createdAt: Date;
  updatedAt: Date;
}

const SidebarMenuItemSchema = new Schema<ISidebarMenuItem>(
  {
    id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    roles: {
      type: [String],
      enum: ["admin", "employee"],
      default: ["admin", "employee"],
    },
  },
  { _id: false }
);

const SidebarConfigSchema = new Schema<ISidebarConfig>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true, // Allows null for default configs
    },
    menuItems: {
      type: [SidebarMenuItemSchema],
      required: true,
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["admin", "employee", "global"],
      required: true,
      default: "global",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SidebarConfigSchema.index({ userId: 1, role: 1 });
SidebarConfigSchema.index({ isDefault: 1, role: 1 });

export const SidebarConfig = mongoose.model<ISidebarConfig>(
  "SidebarConfig",
  SidebarConfigSchema
);
