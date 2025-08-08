#!/usr/bin/env node

/**
 * Clean Sidebar Setup Script
 * Tạo cấu hình sidebar tối ưu cho real-estate database
 */

const mongoose = require("mongoose");

// Define schema directly in script to avoid import issues
const SidebarConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        path: { type: String, required: true },
        parentId: { type: String },
        order: { type: Number, required: true, default: 0 },
        isVisible: { type: Boolean, default: true },
        allowedRoles: [
          { type: String, enum: ["admin", "employee"], required: true },
        ],
        metadata: { type: Object, default: {} },
      },
    ],
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "sidebarconfigs",
  }
);

const SidebarConfig = mongoose.model("SidebarConfig", SidebarConfigSchema);

// Database connection - correct name
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Optimized sidebar configuration
const cleanSidebarConfig = {
  name: "Admin Sidebar - Clean Version",
  isDefault: true,
  items: [
    // DASHBOARD GROUP
    {
      id: "dashboard-group",
      title: "Tổng quan",
      path: "#",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/admin",
      parentId: "dashboard-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "analytics",
      title: "Thống kê",
      path: "/admin/thong-ke",
      parentId: "dashboard-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },

    // PROPERTIES GROUP
    {
      id: "properties-group",
      title: "Bất động sản",
      path: "#",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "all-properties",
      title: "Tất cả BĐS",
      path: "/admin/tat-ca-bds",
      parentId: "properties-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "property-categories",
      title: "Danh mục BĐS",
      path: "/admin/danh-muc-bds",
      parentId: "properties-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "projects",
      title: "Dự án",
      path: "/admin/du-an",
      parentId: "properties-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },

    // USERS GROUP (Admin only)
    {
      id: "users-group",
      title: "Người dùng",
      path: "#",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "all-users",
      title: "Tất cả người dùng",
      path: "/admin/tat-ca-nguoi-dung",
      parentId: "users-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "user-permissions",
      title: "Phân quyền",
      path: "/admin/phan-quyen",
      parentId: "users-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // CONTENT GROUP
    {
      id: "content-group",
      title: "Nội dung",
      path: "#",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "news",
      title: "Tin tức",
      path: "/admin/tin-tuc",
      parentId: "content-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "news-categories",
      title: "Danh mục tin tức",
      path: "/admin/danh-muc-tin-tuc",
      parentId: "content-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // SYSTEM GROUP (Admin only)
    {
      id: "system-group",
      title: "Hệ thống",
      path: "#",
      order: 5,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "settings",
      title: "Cài đặt",
      path: "/admin/cai-dat",
      parentId: "system-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "sidebar-config",
      title: "Cấu hình Sidebar",
      path: "/admin/cau-hinh-sidebar",
      parentId: "system-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
  ],
};

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB (real-estate database)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

async function setupCleanSidebar() {
  try {
    console.log("🚀 Starting clean sidebar setup...");

    // Clear existing configurations
    const deleteResult = await SidebarConfig.deleteMany({});
    console.log(
      `🗑️  Deleted ${deleteResult.deletedCount} existing configurations`
    );

    // Create new clean configuration
    const newConfig = new SidebarConfig(cleanSidebarConfig);
    const savedConfig = await newConfig.save();

    console.log("✅ Created clean sidebar configuration:");
    console.log(`   - ID: ${savedConfig._id}`);
    console.log(`   - Name: ${savedConfig.name}`);
    console.log(`   - Total items: ${savedConfig.items.length}`);

    // Count groups and children
    const groups = savedConfig.items.filter((item) => item.metadata?.isGroup);
    const children = savedConfig.items.filter((item) => item.parentId);

    console.log(`   - Groups: ${groups.length}`);
    console.log(`   - Menu items: ${children.length}`);

    // Role access summary
    console.log("\n👥 Role Access Summary:");
    const adminItems = savedConfig.items.filter((item) =>
      item.allowedRoles.includes("admin")
    );
    const employeeItems = savedConfig.items.filter((item) =>
      item.allowedRoles.includes("employee")
    );

    console.log(`   - Admin: ${adminItems.length} items accessible`);
    console.log(`   - Employee: ${employeeItems.length} items accessible`);

    console.log("\n🎉 Clean sidebar setup completed successfully!");
    console.log("\n💡 Next steps:");
    console.log("   1. Start your backend server: npm run dev");
    console.log("   2. Start your frontend server");
    console.log("   3. Login as admin or employee to test");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

async function main() {
  await connectDatabase();
  await setupCleanSidebar();
  await mongoose.connection.close();
  console.log("👋 Database connection closed");
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
}

module.exports = { cleanSidebarConfig, setupCleanSidebar };
