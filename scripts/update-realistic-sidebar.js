const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Define SidebarConfig schema
const sidebarConfigSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    groups: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
        items: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            href: { type: String, required: true },
            icon: { type: String, required: true },
            order: { type: Number, required: true },
            isActive: { type: Boolean, default: true },
            roles: [{ type: String, required: true }],
            description: String,
            badge: String,
            children: [{ type: mongoose.Schema.Types.Mixed }],
          },
        ],
        isCollapsible: { type: Boolean, default: true },
        defaultExpanded: { type: Boolean, default: false },
      },
    ],
    isDefault: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    createdBy: { type: String, default: "system" },
    lastModifiedBy: { type: String, default: "system" },
  },
  {
    timestamps: true,
  }
);

// Ensure only one default config exists
sidebarConfigSchema.pre("save", async function (next) {
  if (this.isDefault) {
    await mongoose
      .model("SidebarConfig")
      .updateMany({ _id: { $ne: this._id } }, { $set: { isDefault: false } });
  }
  next();
});

const SidebarConfig = mongoose.model("SidebarConfig", sidebarConfigSchema);

// Realistic sidebar configuration based on actual admin pages
const realisticSidebarConfig = {
  name: "Real Estate Admin - Production Ready",
  isDefault: true,
  groups: [
    {
      id: "dashboard",
      name: "Tổng quan",
      icon: "HomeIcon",
      items: [
        {
          id: "dashboard",
          name: "Dashboard",
          href: "/admin",
          icon: "HomeIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Trang tổng quan hệ thống",
        },
        {
          id: "stats",
          name: "Thống kê",
          href: "/admin/thong-ke",
          icon: "ChartBarIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Báo cáo và thống kê chi tiết",
          badge: "Hot",
        },
      ],
      isCollapsible: false,
      defaultExpanded: true,
    },
    {
      id: "content-management",
      name: "Quản lý nội dung",
      icon: "DocumentTextIcon",
      items: [
        {
          id: "posts",
          name: "Quản lý tin đăng",
          href: "/admin/quan-ly-tin-dang",
          icon: "DocumentTextIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý và duyệt tin đăng BĐS",
          badge: "Primary",
        },
        {
          id: "news",
          name: "Quản lý tin tức",
          href: "/admin/quan-ly-tin-tuc",
          icon: "NewspaperIcon",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý bài viết tin tức",
        },
        {
          id: "categories",
          name: "Danh mục BĐS",
          href: "/admin/quan-ly-danh-muc",
          icon: "TagIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý danh mục bất động sản",
        },
        {
          id: "news-section",
          name: "Tin tức",
          href: "/admin/news",
          icon: "MegaphoneIcon",
          order: 4,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý tin tức và bài viết",
        },
      ],
      isCollapsible: true,
      defaultExpanded: true,
    },
    {
      id: "user-management",
      name: "Quản lý người dùng",
      icon: "UserGroupIcon",
      items: [
        {
          id: "users",
          name: "Người dùng",
          href: "/admin/quan-ly-nguoi-dung",
          icon: "UserGroupIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tài khoản người dùng",
        },
        {
          id: "contact-management",
          name: "Liên hệ",
          href: "/admin/quan-ly-lien-he",
          icon: "PhoneIcon",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý yêu cầu liên hệ",
        },
        {
          id: "developers",
          name: "Chủ đầu tư",
          href: "/admin/quan-ly-chu-dau-tu",
          icon: "BuildingOfficeIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý thông tin chủ đầu tư",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "property-data",
      name: "Dữ liệu BĐS",
      icon: "HomeModernIcon",
      items: [
        {
          id: "projects",
          name: "Dự án",
          href: "/admin/quan-ly-du-an",
          icon: "BuildingOfficeIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý dự án bất động sản",
        },
        {
          id: "locations",
          name: "Địa chính",
          href: "/admin/quan-ly-dia-chinh",
          icon: "MapIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tỉnh thành, quận huyện",
        },
        {
          id: "areas",
          name: "Diện tích",
          href: "/admin/quan-ly-dien-tich",
          icon: "Square3Stack3DIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý khoảng diện tích",
        },
        {
          id: "areas-page",
          name: "Quản lý diện tích",
          href: "/admin/areas",
          icon: "CubeIcon",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Trang quản lý diện tích chi tiết",
        },
        {
          id: "prices",
          name: "Khoảng giá",
          href: "/admin/quan-ly-gia",
          icon: "BanknotesIcon",
          order: 5,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý khoảng giá BĐS",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "financial",
      name: "Tài chính",
      icon: "CurrencyDollarIcon",
      items: [
        {
          id: "transactions",
          name: "Giao dịch",
          href: "/admin/quan-ly-giao-dich",
          icon: "CurrencyDollarIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý giao dịch thanh toán",
        },
        {
          id: "packages",
          name: "Gói tin đăng",
          href: "/admin/quan-ly-gia-tin-dang",
          icon: "CubeIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý gói và giá tin đăng",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "system-settings",
      name: "Cài đặt hệ thống",
      icon: "CogIcon",
      items: [
        {
          id: "general-settings",
          name: "Cài đặt chung",
          href: "/admin/cai-dat",
          icon: "CogIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Cài đặt tổng quan hệ thống",
        },
        {
          id: "header-settings",
          name: "Cài đặt header",
          href: "/admin/cai-dat-header",
          icon: "WindowIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Cấu hình header trang web",
        },
        {
          id: "sidebar-config",
          name: "Cấu hình Sidebar",
          href: "/admin/cau-hinh-sidebar",
          icon: "Bars3Icon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý cấu hình menu sidebar",
          badge: "New",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
  ],
};

// Simple config for testing
const simpleTestConfig = {
  name: "Simple Test Configuration",
  isDefault: false,
  groups: [
    {
      id: "main",
      name: "Chính",
      icon: "HomeIcon",
      items: [
        {
          id: "dashboard-simple",
          name: "Trang chủ",
          href: "/admin",
          icon: "HomeIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Trang chính admin",
        },
        {
          id: "posts-simple",
          name: "Tin đăng",
          href: "/admin/quan-ly-tin-dang",
          icon: "DocumentTextIcon",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý tin đăng",
        },
        {
          id: "users-simple",
          name: "Người dùng",
          href: "/admin/quan-ly-nguoi-dung",
          icon: "UserGroupIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý người dùng",
        },
      ],
      isCollapsible: false,
      defaultExpanded: true,
    },
    {
      id: "settings-simple",
      name: "Cài đặt",
      icon: "CogIcon",
      items: [
        {
          id: "sidebar-simple",
          name: "Cấu hình Sidebar",
          href: "/admin/cau-hinh-sidebar",
          icon: "Bars3Icon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Cấu hình sidebar",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
  ],
};

async function connectToDatabase() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

async function updateSidebarWithRealPages() {
  try {
    console.log("🔄 Updating sidebar configuration with real admin pages...");

    // Clear existing configs
    await SidebarConfig.deleteMany({});
    console.log("🗑️  Cleared existing sidebar configurations");

    // Insert realistic configuration
    const realisticConfig = await SidebarConfig.create(realisticSidebarConfig);
    console.log(
      "✅ Created realistic sidebar configuration:",
      realisticConfig._id
    );

    // Insert simple test configuration
    const simpleConfig = await SidebarConfig.create(simpleTestConfig);
    console.log("✅ Created simple test configuration:", simpleConfig._id);

    console.log("\n📊 Updated Sidebar Configuration Summary:");
    console.log(
      `📁 Realistic config has ${realisticSidebarConfig.groups.length} groups`
    );
    console.log(
      `📁 Simple config has ${simpleTestConfig.groups.length} groups`
    );

    // Count total menu items
    const realisticItemsCount = realisticSidebarConfig.groups.reduce(
      (total, group) => total + group.items.length,
      0
    );
    const simpleItemsCount = simpleTestConfig.groups.reduce(
      (total, group) => total + group.items.length,
      0
    );

    console.log(`📋 Realistic config has ${realisticItemsCount} menu items`);
    console.log(`📋 Simple config has ${simpleItemsCount} menu items`);

    // Show actual admin pages mapped
    console.log("\n🔗 Admin Pages Mapped:");
    realisticSidebarConfig.groups.forEach((group) => {
      console.log(`\n📁 ${group.name}:`);
      group.items.forEach((item) => {
        console.log(`   📄 ${item.name} → ${item.href}`);
      });
    });

    // Show roles summary
    const roles = ["admin", "employee"];
    console.log("\n👥 Role Access Summary (Realistic Config):");
    roles.forEach((role) => {
      const accessCount = realisticSidebarConfig.groups.reduce(
        (total, group) => {
          return (
            total +
            group.items.filter((item) => item.roles.includes(role)).length
          );
        },
        0
      );
      console.log(`   ${role}: ${accessCount} items accessible`);
    });

    console.log("\n🎉 Sidebar configuration updated with real admin pages!");
    console.log("\n💡 You can now:");
    console.log("   1. Start your backend server");
    console.log("   2. Access the admin panel");
    console.log("   3. Navigate to real admin pages through the sidebar");
    console.log(
      "   4. Test the sidebar configuration manager at /admin/cau-hinh-sidebar"
    );
  } catch (error) {
    console.error("❌ Error updating sidebar configuration:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await updateSidebarWithRealPages();

    console.log("\n✨ Update completed! Closing database connection...");
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  console.log("🚀 Updating sidebar with real admin pages...\n");
  main();
}

module.exports = {
  realisticSidebarConfig,
  simpleTestConfig,
  updateSidebarWithRealPages,
};
