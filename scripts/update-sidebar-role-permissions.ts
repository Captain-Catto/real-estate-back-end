/**
 * Script để cập nhật cấu hình sidebar với quyền hạn chi tiết cho employee
 * Script này mở rộng từ update-sidebar-permissions.ts với các quyền chi tiết hơn
 */

import mongoose from "mongoose";
import SidebarConfig, { IMenuItem } from "../src/models/SidebarConfig";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

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
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Quyền cho từng menu với phân loại chi tiết theo role
const permissionsByRole = {
  admin: {
    // Admin có tất cả các quyền
    dashboard: [],
    users: [
      "view_users",
      "create_user",
      "edit_user",
      "delete_user",
      "change_user_role",
      "change_user_status",
    ],
    "employee-management": [
      "view_users",
      "create_user",
      "edit_user",
      "delete_user",
      "change_user_role",
      "change_user_status",
    ],
    developers: ["view_users", "edit_user", "delete_user"],
    posts: [
      "view_posts",
      "create_post",
      "edit_post",
      "delete_post",
      "approve_post",
      "reject_post",
    ],
    news: ["view_posts", "create_post", "edit_post", "delete_post"],
    "news-categories": [
      "view_posts",
      "create_post",
      "edit_post",
      "delete_post",
    ],
    transactions: [
      "view_transactions",
      "create_transaction",
      "edit_transaction",
    ],
    packages: ["view_transactions", "create_transaction", "edit_transaction"],
    stats: ["view_statistics", "export_statistics"],
    settings: ["view_settings", "edit_settings"],
    "sidebar-config": ["view_settings", "edit_settings"],
    locations: ["view_settings", "edit_settings"],
    projects: ["view_posts", "create_post", "edit_post", "delete_post"],
    categories: ["view_settings", "edit_settings"],
    areas: ["view_settings", "edit_settings"],
    prices: ["view_settings", "edit_settings"],
  },
  employee: {
    // Employee có quyền quản lý người dùng đầy đủ
    dashboard: [],
    users: [
      "view_users",
      "create_user",
      "edit_user",
      "delete_user",
      "change_user_status",
      "reset_user_password",
    ],
    "employee-management": [], // Không có quyền
    developers: ["view_users"],
    posts: [
      "view_posts",
      "create_post",
      "edit_post",
      "approve_post",
      "reject_post",
    ],
    news: ["view_posts", "create_post", "edit_post"],
    "news-categories": ["view_posts"],
    transactions: ["view_transactions"],
    packages: ["view_transactions"],
    stats: ["view_statistics"],
    settings: [], // Không có quyền
    "sidebar-config": [], // Không có quyền
    locations: ["view_settings"],
    projects: ["view_posts", "create_post", "edit_post"],
    categories: ["view_settings"],
    areas: ["view_settings"],
    prices: ["view_settings"],
  },
};

/**
 * Cập nhật các quyền và hiển thị của menu dựa theo vai trò
 */
const updateMenuRolesAndPermissions = async () => {
  try {
    // Tìm cấu hình sidebar bằng ID đã biết
    const configId = "6890b2860bd0dcde306e8eba";
    let sidebarConfig = await SidebarConfig.findById(configId);

    // Nếu không tìm thấy, thử tìm theo isDefault hoặc name
    if (!sidebarConfig) {
      console.log(
        `Không tìm thấy cấu hình sidebar với ID ${configId}, tìm theo isDefault...`
      );
      sidebarConfig = await SidebarConfig.findOne({
        $or: [{ isDefault: true }, { name: "Cấu hình Sidebar Mặc định" }],
      });
    }

    if (!sidebarConfig) {
      console.log("Không tìm thấy cấu hình sidebar mặc định");
      return;
    }

    console.log(
      `Đã tìm thấy cấu hình sidebar: ${
        sidebarConfig.name || "Không có tên"
      } (ID: ${sidebarConfig._id})`
    );

    // Tạo bảng ánh xạ: menuId -> các quyền theo role
    const permissionsMap = new Map();
    Object.entries(permissionsByRole).forEach(([role, menus]) => {
      Object.entries(menus).forEach(([menuId, permissions]) => {
        if (!permissionsMap.has(menuId)) {
          permissionsMap.set(menuId, {
            permissions: new Set(),
            roles: new Set(),
          });
        }

        // Thêm role vào menu
        permissionsMap.get(menuId).roles.add(role);

        // Thêm permissions cho menu
        permissions.forEach((perm) => {
          permissionsMap.get(menuId).permissions.add(perm);
        });
      });
    });

    // Cập nhật từng menu item
    const updatedItems = sidebarConfig.items.map((item: any) => {
      // Clone item để không thay đổi trực tiếp
      const itemObj =
        typeof item.toObject === "function" ? item.toObject() : { ...item };
      const updatedItem = { ...itemObj };

      // Đảm bảo có metadata
      if (!updatedItem.metadata) {
        updatedItem.metadata = {};
      }

      // Cập nhật quyền và role cho menu
      const menuConfig = permissionsMap.get(updatedItem.id);
      if (menuConfig) {
        // Thêm tất cả các quyền liên quan
        updatedItem.metadata.permissions = Array.from(menuConfig.permissions);

        // Chỉ cho phép các role có trong cấu hình truy cập
        updatedItem.allowedRoles = Array.from(menuConfig.roles);
      } else {
        // Mặc định chỉ admin truy cập được nếu không có trong cấu hình
        updatedItem.allowedRoles = ["admin"];
        updatedItem.metadata.permissions = [];
      }

      return updatedItem;
    });

    // Cập nhật và lưu
    sidebarConfig.items = updatedItems;
    await sidebarConfig.save();

    console.log("Đã cập nhật quyền và vai trò cho menu thành công");
    console.log(`Cập nhật ${updatedItems.length} mục menu`);

    // Xuất cấu hình ra file json để tham khảo
    exportSidebarConfig(updatedItems);
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền menu:", error);
  }
};

// Xuất cấu hình ra file để tham khảo
const exportSidebarConfig = (items: any[]) => {
  try {
    // Tạo object với thông tin menu và quyền
    const config = items.map((item) => ({
      id: item.id,
      title: item.title,
      path: item.path,
      allowedRoles: item.allowedRoles,
      permissions: item.metadata?.permissions || [],
    }));

    // Ghi ra file
    const filePath = path.join(__dirname, "sidebar-permissions-export.json");
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`Đã xuất cấu hình ra file: ${filePath}`);
  } catch (err) {
    console.error("Lỗi khi xuất cấu hình:", err);
  }
};

// Chạy script
const main = async () => {
  await connectDb();
  await updateMenuRolesAndPermissions();
  process.exit(0);
};

main();
