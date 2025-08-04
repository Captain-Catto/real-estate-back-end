const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Define SidebarConfig schema directly since we're using JS
const MenuItemSchema = new mongoose.Schema(
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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const sidebarConfigSchema = new mongoose.Schema(
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

const SidebarConfig = mongoose.model("SidebarConfig", sidebarConfigSchema);

// Sample sidebar configuration data
const sampleSidebarConfig = {
  name: "Default Real Estate Admin Sidebar",
  isDefault: true,
  items: [
    // Dashboard Group
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/admin",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "analytics",
      title: "Phân tích",
      path: "/admin/phan-tich",
      parentId: "dashboard",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "stats",
      title: "Thống kê",
      path: "/admin/thong-ke",
      parentId: "dashboard",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // Content Management Group
    {
      id: "content-management",
      title: "Quản lý nội dung",
      path: "#",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "posts",
      title: "Quản lý tin đăng",
      path: "/admin/quan-ly-tin-dang",
      parentId: "content-management",
      order: 5,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "posts-pending",
      title: "Tin đăng chờ duyệt",
      path: "/admin/tin-dang-cho-duyet",
      parentId: "content-management",
      order: 6,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "news",
      title: "Quản lý tin tức",
      path: "/admin/quan-ly-tin-tuc",
      parentId: "content-management",
      order: 7,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "categories",
      title: "Danh mục BĐS",
      path: "/admin/quan-ly-danh-muc",
      parentId: "content-management",
      order: 8,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "news-categories",
      title: "Danh mục tin tức",
      path: "/admin/danh-muc-tin-tuc",
      parentId: "content-management",
      order: 9,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // User Management Group
    {
      id: "user-management",
      title: "Quản lý người dùng",
      path: "#",
      order: 10,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "users",
      title: "Người dùng",
      path: "/admin/quan-ly-nguoi-dung",
      parentId: "user-management",
      order: 11,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "user-verification",
      title: "Xác thực người dùng",
      path: "/admin/xac-thuc-nguoi-dung",
      parentId: "user-management",
      order: 12,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "contact-management",
      title: "Liên hệ",
      path: "/admin/quan-ly-lien-he",
      parentId: "user-management",
      order: 13,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "developers",
      title: "Chủ đầu tư",
      path: "/admin/quan-ly-chu-dau-tu",
      parentId: "user-management",
      order: 14,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "agents",
      title: "Môi giới",
      path: "/admin/quan-ly-moi-gioi",
      parentId: "user-management",
      order: 15,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // Property Management Group
    {
      id: "property-management",
      title: "Quản lý dữ liệu BĐS",
      path: "#",
      order: 16,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "projects",
      title: "Dự án",
      path: "/admin/quan-ly-du-an",
      parentId: "property-management",
      order: 17,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "project-types",
      title: "Loại dự án",
      path: "/admin/loai-du-an",
      parentId: "property-management",
      order: 18,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "locations",
      title: "Địa chính",
      path: "/admin/quan-ly-dia-chinh",
      parentId: "property-management",
      order: 19,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "areas",
      title: "Diện tích",
      path: "/admin/quan-ly-dien-tich",
      parentId: "property-management",
      order: 20,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "prices",
      title: "Khoảng giá",
      path: "/admin/quan-ly-gia",
      parentId: "property-management",
      order: 21,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "amenities",
      title: "Tiện ích",
      path: "/admin/quan-ly-tien-ich",
      parentId: "property-management",
      order: 22,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // Financial Group
    {
      id: "financial",
      title: "Tài chính",
      path: "#",
      order: 23,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "transactions",
      title: "Giao dịch",
      path: "/admin/quan-ly-giao-dich",
      parentId: "financial",
      order: 24,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "packages",
      title: "Gói tin đăng",
      path: "/admin/quan-ly-gia-tin-dang",
      parentId: "financial",
      order: 25,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "wallet",
      title: "Ví điện tử",
      path: "/admin/quan-ly-vi",
      parentId: "financial",
      order: 26,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "revenue",
      title: "Doanh thu",
      path: "/admin/doanh-thu",
      parentId: "financial",
      order: 27,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // Marketing Group
    {
      id: "marketing",
      title: "Marketing",
      path: "#",
      order: 28,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "banners",
      title: "Banner quảng cáo",
      path: "/admin/quan-ly-banner",
      parentId: "marketing",
      order: 29,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "promotions",
      title: "Khuyến mãi",
      path: "/admin/khuyen-mai",
      parentId: "marketing",
      order: 30,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "seo",
      title: "SEO Settings",
      path: "/admin/cau-hinh-seo",
      parentId: "marketing",
      order: 31,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // Reports Group
    {
      id: "reports",
      title: "Báo cáo",
      path: "#",
      order: 32,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "user-activity",
      title: "Hoạt động người dùng",
      path: "/admin/bao-cao-hoat-dong",
      parentId: "reports",
      order: 33,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "property-stats",
      title: "Thống kê BĐS",
      path: "/admin/thong-ke-bds",
      parentId: "reports",
      order: 34,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "system-logs",
      title: "Log hệ thống",
      path: "/admin/log-he-thong",
      parentId: "reports",
      order: 35,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },

    // System Group
    {
      id: "system",
      title: "Hệ thống",
      path: "#",
      order: 36,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "sidebar-config",
      title: "Cấu hình Sidebar",
      path: "/admin/cau-hinh-sidebar",
      parentId: "system",
      order: 37,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "site-settings",
      title: "Cài đặt trang web",
      path: "/admin/cai-dat-trang-web",
      parentId: "system",
      order: 38,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "notifications",
      title: "Thông báo hệ thống",
      path: "/admin/thong-bao-he-thong",
      parentId: "system",
      order: 39,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "backup",
      title: "Sao lưu dữ liệu",
      path: "/admin/sao-luu",
      parentId: "system",
      order: 40,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "maintenance",
      title: "Bảo trì",
      path: "/admin/bao-tri",
      parentId: "system",
      order: 41,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
  ],
};

// Alternative sidebar config for testing different layouts
const alternativeSidebarConfig = {
  name: "Alternative Layout - Simple",
  isDefault: false,
  items: [
    {
      id: "main",
      title: "Chính",
      path: "#",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { isGroup: true },
    },
    {
      id: "dashboard",
      title: "Trang chủ",
      path: "/admin",
      parentId: "main",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "all-posts",
      title: "Tất cả tin đăng",
      path: "/admin/tat-ca-tin-dang",
      parentId: "main",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {},
    },
    {
      id: "all-users",
      title: "Tất cả người dùng",
      path: "/admin/tat-ca-nguoi-dung",
      parentId: "main",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "settings-simple",
      title: "Cài đặt",
      path: "#",
      order: 5,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true },
    },
    {
      id: "general-settings",
      title: "Cài đặt chung",
      path: "/admin/cai-dat-chung",
      parentId: "settings-simple",
      order: 6,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
    },
    {
      id: "sidebar-manager",
      title: "Quản lý Sidebar",
      path: "/admin/cau-hinh-sidebar",
      parentId: "settings-simple",
      order: 7,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {},
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

async function populateSidebarConfig() {
  try {
    console.log("🔄 Starting sidebar configuration population...");

    // Clear existing configs
    await SidebarConfig.deleteMany({});
    console.log("🗑️  Cleared existing sidebar configurations");

    // Insert sample configurations
    const defaultConfig = await SidebarConfig.create(sampleSidebarConfig);
    console.log("✅ Created default sidebar configuration:", defaultConfig._id);

    const altConfig = await SidebarConfig.create(alternativeSidebarConfig);
    console.log("✅ Created alternative sidebar configuration:", altConfig._id);

    console.log("\n📊 Sidebar Configuration Summary:");
    console.log(
      `📁 Default config has ${sampleSidebarConfig.items.length} menu items`
    );
    console.log(
      `📁 Alternative config has ${alternativeSidebarConfig.items.length} menu items`
    );

    // Count groups and children
    const defaultGroups = sampleSidebarConfig.items.filter(
      (item) => item.metadata?.isGroup
    );
    const defaultChildren = sampleSidebarConfig.items.filter(
      (item) => item.parentId
    );

    console.log(`📋 Default config has ${defaultGroups.length} groups`);
    console.log(
      `📋 Default config has ${defaultChildren.length} menu children`
    );

    // Show roles summary
    const roles = ["admin", "employee"];
    console.log("\n👥 Role Access Summary:");
    roles.forEach((role) => {
      const defaultAccessCount = sampleSidebarConfig.items.filter((item) =>
        item.allowedRoles.includes(role)
      ).length;
      console.log(
        `   ${role}: ${defaultAccessCount} items accessible in default config`
      );
    });

    console.log(
      "\n🎉 Sidebar configuration population completed successfully!"
    );
    console.log("\n💡 You can now test the sidebar by:");
    console.log("   1. Starting your backend server");
    console.log("   2. Logging into your admin panel");
    console.log(
      "   3. Visiting /admin/cau-hinh-sidebar to manage configurations"
    );
  } catch (error) {
    console.error("❌ Error populating sidebar configuration:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await populateSidebarConfig();

    console.log("\n✨ All done! Closing database connection...");
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  sampleSidebarConfig,
  alternativeSidebarConfig,
  populateSidebarConfig,
};
