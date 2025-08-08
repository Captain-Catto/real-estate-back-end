const mongoose = require("mongoose");
const path = require("path");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// SidebarConfig Schema (inline definition)
const SidebarConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        path: { type: String, required: true },
        parentId: { type: String },
        order: { type: Number, required: true },
        isVisible: { type: Boolean, default: true },
        allowedRoles: [{ type: String, enum: ["admin", "employee"] }],
        metadata: {
          isGroup: { type: Boolean, default: false },
          icon: String,
          badge: String,
          permissions: [String], // Added permissions field
        },
      },
    ],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optimized sidebar configuration
const optimizedSidebarConfig = {
  name: "Admin Sidebar - Optimized",
  isDefault: true,
  items: [
    // MAIN GROUP - Chính
    {
      id: "main-group",
      title: "Trang chính",
      path: "#",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true, icon: "HomeIcon", permissions: [] },
    },
    {
      id: "dashboard",
      title: "Tổng quan",
      path: "/admin",
      parentId: "main-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { icon: "ChartBarIcon", permissions: ["view_statistics"] },
    },
    {
      id: "statistics",
      title: "Thống kê",
      path: "/admin/thong-ke",
      parentId: "main-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {
        icon: "PresentationChartLineIcon",
        permissions: ["view_statistics"],
      },
    },

    // CONTENT GROUP - Nội dung
    {
      id: "content-group",
      title: "Quản lý nội dung",
      path: "#",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true, icon: "DocumentTextIcon", permissions: [] },
    },
    {
      id: "posts",
      title: "Bài đăng BĐS",
      path: "/admin/quan-ly-tin-dang",
      parentId: "content-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { icon: "HomeIcon", permissions: ["view_posts"] },
    },
    {
      id: "news",
      title: "Tin tức",
      path: "/admin/quan-ly-tin-tuc",
      parentId: "content-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { icon: "NewspaperIcon", permissions: ["view_news"] },
    },
    {
      id: "projects",
      title: "Dự án",
      path: "/admin/quan-ly-du-an",
      parentId: "content-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { icon: "BuildingOfficeIcon", permissions: ["view_projects"] },
    },

    // USERS GROUP - Người dùng (Admin only)
    {
      id: "users-group",
      title: "Quản lý người dùng",
      path: "#",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        isGroup: true,
        icon: "UsersIcon",
        permissions: ["view_users"],
      },
    },
    {
      id: "all-users",
      title: "Tất cả người dùng",
      path: "/admin/quan-ly-nguoi-dung",
      parentId: "users-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { icon: "UserGroupIcon", permissions: ["view_users"] },
    },
    {
      id: "employees",
      title: "Nhân viên",
      path: "/admin/employee-permissions",
      parentId: "users-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        icon: "UserIcon",
        permissions: ["view_users", "manage_permissions"],
      },
    },

    // SYSTEM GROUP - Hệ thống (Admin only)
    {
      id: "system-group",
      title: "Cài đặt hệ thống",
      path: "#",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        isGroup: true,
        icon: "CogIcon",
        permissions: ["view_settings"],
      },
    },
    {
      id: "general-settings",
      title: "Cài đặt chung",
      path: "/admin/cai-dat-chung",
      parentId: "system-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        icon: "AdjustmentsHorizontalIcon",
        permissions: ["edit_settings"],
      },
    },
    {
      id: "sidebar-config",
      title: "Cấu hình Sidebar",
      path: "/admin/cau-hinh-sidebar",
      parentId: "system-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { icon: "Bars3Icon", permissions: ["manage_sidebar"] },
    },
  ],
};

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function setupOptimizedSidebar() {
  try {
    console.log("🚀 Starting optimized sidebar setup...");

    // Define the model
    const SidebarConfig = mongoose.model("SidebarConfig", SidebarConfigSchema);

    // Clear existing configs
    await SidebarConfig.deleteMany({});
    console.log("🗑️  Cleared existing sidebar configurations");

    // Create optimized config
    const config = await SidebarConfig.create(optimizedSidebarConfig);
    console.log("✅ Created optimized sidebar configuration:", config._id);

    // Summary
    const totalItems = config.items.length;
    const groups = config.items.filter((item) => item.metadata?.isGroup);
    const menuItems = config.items.filter((item) => !item.metadata?.isGroup);

    console.log("\n📊 Configuration Summary:");
    console.log(`📁 Total items: ${totalItems}`);
    console.log(`📁 Groups: ${groups.length}`);
    console.log(`📁 Menu items: ${menuItems.length}`);

    // Role access summary
    const adminItems = config.items.filter((item) =>
      item.allowedRoles.includes("admin")
    );
    const employeeItems = config.items.filter((item) =>
      item.allowedRoles.includes("employee")
    );

    console.log("\n👥 Role Access Summary:");
    console.log(`   admin: ${adminItems.length} items accessible`);
    console.log(`   employee: ${employeeItems.length} items accessible`);

    console.log("\n🎉 Optimized sidebar setup completed successfully!");
    console.log(
      "💡 You can now test the admin sidebar at: http://localhost:3000/admin"
    );
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

async function main() {
  await connectDatabase();
  await setupOptimizedSidebar();

  console.log("\n✨ All done! Closing database connection...");
  await mongoose.connection.close();
  console.log("👋 Database connection closed");
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizedSidebarConfig, setupOptimizedSidebar };
