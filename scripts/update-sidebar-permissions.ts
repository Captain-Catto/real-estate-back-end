/**
 * Script để cập nhật cấu hình sidebar với quyền hạn
 * Chạy script này để thêm quyền vào các mục menu
 */

import mongoose from "mongoose";
import SidebarConfig, { IMenuItem } from "../src/models/SidebarConfig";
import { config } from "dotenv";

// Load biến môi trường
config();

// Cấu hình cơ sở dữ liệu
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Hàm kết nối DB
const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
    console.log("Kết nối đến database:", MONGODB_URI);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Quyền cho từng menu
const permissionMap: Record<string, string[]> = {
  // Trang chủ Admin
  dashboard: [],

  // Quản lý người dùng
  users: ["view_users", "create_user", "edit_user", "delete_user"],
  "employee-management": [
    "view_users",
    "create_user",
    "edit_user",
    "delete_user",
    "change_user_role",
    "change_user_status",
  ],
  developers: ["view_users", "edit_user"],

  // Quản lý bài đăng
  posts: [
    "view_posts",
    "create_post",
    "edit_post",
    "delete_post",
    "approve_post",
    "reject_post",
  ],

  // Quản lý tin tức
  news: ["view_posts", "create_post", "edit_post", "delete_post"],
  "news-categories": ["view_posts", "create_post", "edit_post", "delete_post"],

  // Quản lý giao dịch
  transactions: ["view_transactions"],
  packages: ["view_transactions"],

  // Thống kê
  stats: ["view_statistics"],

  // Cài đặt
  settings: ["view_settings", "edit_settings"],
  "sidebar-config": ["view_settings", "edit_settings"],

  // Quản lý dữ liệu
  locations: ["view_settings", "edit_settings"],
  projects: ["view_posts", "create_post", "edit_post", "delete_post"],
  categories: ["view_settings", "edit_settings"],
  areas: ["view_settings", "edit_settings"],
  prices: ["view_settings", "edit_settings"],
};

// Cập nhật menu với quyền
const updateMenuPermissions = async () => {
  try {
    // Tìm cấu hình sidebar bằng ID đã biết
    const configId = "6890b2860bd0dcde306e8eba";
    let sidebarConfig = await SidebarConfig.findById(configId);

    // Nếu không tìm thấy, thử tìm theo isDefault
    if (!sidebarConfig) {
      console.log(
        `Không tìm thấy cấu hình sidebar với ID ${configId}, tìm theo isDefault...`
      );
      sidebarConfig = await SidebarConfig.findOne({ isDefault: true });

      // Tạo cấu trúc cơ bản cho sidebar
      sidebarConfig = new SidebarConfig({
        name: "Cấu hình Sidebar Mặc định",
        isDefault: true,
        items: [
          {
            id: "dashboard",
            title: "Trang chủ",
            path: "/admin/dashboard",
            icon: "dashboard",
            allowedRoles: ["admin", "employee"],
            metadata: { permissions: [] },
          },
          {
            id: "users",
            title: "Người dùng",
            path: "/admin/users",
            icon: "users",
            allowedRoles: ["admin"],
            metadata: { permissions: [] },
          },
          {
            id: "posts",
            title: "Bài đăng",
            path: "/admin/posts",
            icon: "file",
            allowedRoles: ["admin", "employee"],
            metadata: { permissions: [] },
          },
        ],
      });

      // Lưu cấu hình mới
      await sidebarConfig.save();
      console.log("Đã tạo cấu hình sidebar mặc định mới");
    }

    console.log(
      `Cấu hình sidebar: ${sidebarConfig.name || "Không có tên"} (ID: ${
        sidebarConfig._id
      })`
    );

    // Cập nhật metadata.permissions cho từng menu item
    const updatedItems = sidebarConfig.items.map((item: any) => {
      // Clone item để không thay đổi trực tiếp
      const itemObj =
        typeof item.toObject === "function" ? item.toObject() : { ...item };
      const updatedItem = { ...itemObj };

      // Đảm bảo có metadata
      if (!updatedItem.metadata) {
        updatedItem.metadata = {};
      }

      // Thêm quyền nếu có trong map
      const menuId = updatedItem.id as string;
      if (menuId && permissionMap.hasOwnProperty(menuId)) {
        updatedItem.metadata.permissions = permissionMap[menuId];
      } else {
        updatedItem.metadata.permissions = [];
      }

      return updatedItem;
    });

    // Cập nhật và lưu
    sidebarConfig.items = updatedItems;
    await sidebarConfig.save();

    console.log("Đã cập nhật quyền cho menu thành công");
    console.log(`Cập nhật ${updatedItems.length} mục menu`);
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền menu:", error);
  }
};

// Chạy script
const main = async () => {
  await connectDb();
  await updateMenuPermissions();
  process.exit(0);
};

main();
