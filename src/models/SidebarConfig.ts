import mongoose, { Document, Schema } from "mongoose";

/**
 * Menu Item Interface - Đại diện cho một mục menu trong sidebar
 */
export interface IMenuItem {
  id: string;
  title: string; // Tiêu đề hiển thị của menu item
  path: string; // Đường dẫn khi click vào menu item
  parentId?: string; // ID của menu cha (nếu là menu con)
  order: number; // Thứ tự hiển thị
  isVisible: boolean; // Có hiển thị hay không
  allowedRoles: string[]; // Các role được phép xem menu này
  metadata?: Record<string, any>; // Dữ liệu tùy chỉnh như badge, external link, etc.
}

/**
 * Sidebar Config Interface - Đại diện cho cấu hình sidebar
 */
export interface ISidebarConfig extends Document {
  name: string; // Tên của cấu hình sidebar
  items: IMenuItem[]; // Danh sách các menu items
  isDefault: boolean; // Có phải là cấu hình mặc định không
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema cho Menu Item
 */
const MenuItemSchema = new Schema<IMenuItem>(
  {
    id: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    parentId: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    allowedRoles: {
      type: [String],
      default: ["admin"],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

/**
 * Schema cho SidebarConfig
 */
const SidebarConfigSchema = new Schema<ISidebarConfig>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    items: {
      type: [MenuItemSchema],
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/**
 * Indexes cho tìm kiếm hiệu quả
 */
SidebarConfigSchema.index({ name: 1 });
SidebarConfigSchema.index({ isDefault: 1 });

/**
 * Phương thức tĩnh: Lấy menu cho role cụ thể
 */
SidebarConfigSchema.statics.getMenuForRole = async function (role: string) {
  const defaultConfig = await this.findOne({ isDefault: true });

  if (!defaultConfig) {
    return [];
  }

  // Lọc các items theo role và chỉ lấy các items visible
  const filteredItems = defaultConfig.items.filter(
    (item: IMenuItem) => item.isVisible && item.allowedRoles.includes(role)
  );

  // Sắp xếp theo order
  return filteredItems.sort((a: IMenuItem, b: IMenuItem) => a.order - b.order);
};

/**
 * Phương thức tĩnh: Tạo cấu hình mặc định nếu chưa có
 */
SidebarConfigSchema.statics.createDefaultConfig = async function () {
  // Kiểm tra xem đã có cấu hình mặc định chưa
  const existingDefault = await this.findOne({ isDefault: true });
  if (existingDefault) {
    return existingDefault;
  }

  // Danh sách menu items mặc định
  const defaultItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/admin",
      order: 0,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "users",
      title: "Người dùng",
      path: "/admin/users",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "projects",
      title: "Dự án",
      path: "/admin/projects",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "posts",
      title: "Bài đăng",
      path: "/admin/posts",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "settings",
      title: "Cài đặt",
      path: "/admin/settings",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
  ];

  // Tạo và lưu cấu hình mặc định
  return await this.create({
    name: "Default",
    items: defaultItems,
    isDefault: true,
  });
};

// Export model
const SidebarConfig = mongoose.model<ISidebarConfig>(
  "SidebarConfig",
  SidebarConfigSchema
);
export default SidebarConfig;
