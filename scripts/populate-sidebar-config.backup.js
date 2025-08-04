const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Define SidebarConfig schema directly since we're using JS
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
        order: { type: Number, required: true, default: 0 },
        items: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            href: { type: String, required: true },
            order: { type: Number, required: true },
            isActive: { type: Boolean, default: true },
            roles: [{ type: String, required: true }],
            description: String,
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

// Sample sidebar configuration data
const sampleSidebarConfig = {
  name: "Default Real Estate Admin Sidebar",
  isDefault: true,
  groups: [
    {
      id: "dashboard",
      name: "Tổng quan",
      order: 1,
      items: [
        {
          id: "dashboard",
          name: "Dashboard",
          href: "/admin",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Trang tổng quan hệ thống",
        },
        {
          id: "analytics",
          name: "Phân tích",
          href: "/admin/phan-tich",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Báo cáo và phân tích chi tiết",
        },
        {
          id: "stats",
          name: "Thống kê",
          href: "/admin/thong-ke",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Thống kê dữ liệu tổng quan",
        },
      ],
      isCollapsible: false,
      defaultExpanded: true,
    },
    {
      id: "content-management",
      name: "Quản lý nội dung",
      order: 2,
      items: [
        {
          id: "posts",
          name: "Quản lý tin đăng",
          href: "/admin/quan-ly-tin-dang",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý và duyệt tin đăng BĐS",
        },
        {
          id: "posts-pending",
          name: "Tin đăng chờ duyệt",
          href: "/admin/tin-dang-cho-duyet",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Duyệt tin đăng mới",
        },
        {
          id: "news",
          name: "Quản lý tin tức",
          href: "/admin/quan-ly-tin-tuc",
          order: 3,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý bài viết tin tức",
        },
        {
          id: "categories",
          name: "Danh mục BĐS",
          href: "/admin/quan-ly-danh-muc",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý danh mục BĐS",
        },
        {
          id: "news-categories",
          name: "Danh mục tin tức",
          href: "/admin/danh-muc-tin-tuc",
          order: 5,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý danh mục tin tức",
        },
      ],
      isCollapsible: true,
      defaultExpanded: true,
    },
    {
      id: "user-management",
      name: "Quản lý người dùng",
      items: [
        {
          id: "users",
          name: "Người dùng",
          href: "/admin/quan-ly-nguoi-dung",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tài khoản người dùng",
        },
        {
          id: "user-verification",
          name: "Xác thực người dùng",
          href: "/admin/xac-thuc-nguoi-dung",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Xác thực và phê duyệt tài khoản",
        },
        {
          id: "contact-management",
          name: "Liên hệ",
          href: "/admin/quan-ly-lien-he",
          order: 3,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý yêu cầu liên hệ",
        },
        {
          id: "developers",
          name: "Chủ đầu tư",
          href: "/admin/quan-ly-chu-dau-tu",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý thông tin chủ đầu tư",
        },
        {
          id: "agents",
          name: "Môi giới",
          href: "/admin/quan-ly-moi-gioi",
          order: 5,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tài khoản môi giới",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "property-management",
      name: "Quản lý dữ liệu BĐS",
      items: [
        {
          id: "projects",
          name: "Dự án",
          href: "/admin/quan-ly-du-an",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý dự án BĐS",
        },
        {
          id: "project-types",
          name: "Loại dự án",
          href: "/admin/loai-du-an",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý loại hình dự án",
        },
        {
          id: "locations",
          name: "Địa chính",
          href: "/admin/quan-ly-dia-chinh",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tỉnh thành, quận huyện",
        },
        {
          id: "areas",
          name: "Diện tích",
          href: "/admin/quan-ly-dien-tich",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý khoảng diện tích",
        },
        {
          id: "prices",
          name: "Khoảng giá",
          href: "/admin/quan-ly-gia",
          order: 5,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý khoảng giá BĐS",
        },
        {
          id: "amenities",
          name: "Tiện ích",
          href: "/admin/quan-ly-tien-ich",
          order: 6,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý tiện ích dự án",
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
        {
          id: "wallet",
          name: "Ví điện tử",
          href: "/admin/quan-ly-vi",
          icon: "WalletIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý ví và số dư người dùng",
        },
        {
          id: "revenue",
          name: "Doanh thu",
          href: "/admin/doanh-thu",
          icon: "TrendingUpIcon",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Báo cáo doanh thu hệ thống",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "marketing",
      name: "Marketing",
      icon: "MegaphoneIcon",
      items: [
        {
          id: "banners",
          name: "Banner quảng cáo",
          href: "/admin/quan-ly-banner",
          icon: "PhotoIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý banner trang chủ",
        },
        {
          id: "promotions",
          name: "Khuyến mãi",
          href: "/admin/khuyen-mai",
          icon: "GiftIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý chương trình khuyến mãi",
        },
        {
          id: "seo",
          name: "SEO Settings",
          href: "/admin/cau-hinh-seo",
          icon: "MagnifyingGlassIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Cấu hình SEO trang web",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "reports",
      name: "Báo cáo",
      icon: "DocumentChartBarIcon",
      items: [
        {
          id: "user-activity",
          name: "Hoạt động người dùng",
          href: "/admin/bao-cao-hoat-dong",
          icon: "UserIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Báo cáo hoạt động người dùng",
        },
        {
          id: "property-stats",
          name: "Thống kê BĐS",
          href: "/admin/thong-ke-bds",
          icon: "ChartBarIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Thống kê tin đăng BĐS",
        },
        {
          id: "system-logs",
          name: "Log hệ thống",
          href: "/admin/log-he-thong",
          icon: "DocumentTextIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Xem log hoạt động hệ thống",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
    {
      id: "system",
      name: "Hệ thống",
      icon: "CogIcon",
      items: [
        {
          id: "sidebar-config",
          name: "Cấu hình Sidebar",
          href: "/admin/cau-hinh-sidebar",
          icon: "Bars3Icon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Cấu hình menu sidebar",
        },
        {
          id: "site-settings",
          name: "Cài đặt trang web",
          href: "/admin/cai-dat-trang-web",
          icon: "CogIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Cấu hình chung trang web",
        },
        {
          id: "notifications",
          name: "Thông báo hệ thống",
          href: "/admin/thong-bao-he-thong",
          icon: "BellIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Quản lý thông báo hệ thống",
        },
        {
          id: "backup",
          name: "Sao lưu dữ liệu",
          href: "/admin/sao-luu",
          icon: "CloudArrowDownIcon",
          order: 4,
          isActive: true,
          roles: ["admin"],
          description: "Sao lưu và phục hồi dữ liệu",
        },
        {
          id: "maintenance",
          name: "Bảo trì",
          href: "/admin/bao-tri",
          icon: "WrenchScrewdriverIcon",
          order: 5,
          isActive: true,
          roles: ["admin"],
          description: "Chế độ bảo trì hệ thống",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
  ],
};

// Alternative sidebar config for testing different layouts
const alternativeSidebarConfig = {
  name: "Alternative Layout - Simple",
  isDefault: false,
  groups: [
    {
      id: "main",
      name: "Chính",
      icon: "HomeIcon",
      items: [
        {
          id: "dashboard",
          name: "Trang chủ",
          href: "/admin",
          icon: "HomeIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Trang chính admin",
        },
        {
          id: "all-posts",
          name: "Tất cả tin đăng",
          href: "/admin/tat-ca-tin-dang",
          icon: "DocumentTextIcon",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Xem tất cả tin đăng",
        },
        {
          id: "all-users",
          name: "Tất cả người dùng",
          href: "/admin/tat-ca-nguoi-dung",
          icon: "UserGroupIcon",
          order: 3,
          isActive: true,
          roles: ["admin"],
          description: "Xem tất cả người dùng",
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
          id: "general-settings",
          name: "Cài đặt chung",
          href: "/admin/cai-dat-chung",
          icon: "CogIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Cài đặt tổng quan",
        },
        {
          id: "sidebar-manager",
          name: "Quản lý Sidebar",
          href: "/admin/cau-hinh-sidebar",
          icon: "Bars3Icon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Thay đổi cấu hình sidebar",
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
      `📁 Default config has ${sampleSidebarConfig.groups.length} groups`
    );
    console.log(
      `📁 Alternative config has ${alternativeSidebarConfig.groups.length} groups`
    );

    // Count total menu items
    const defaultItemsCount = sampleSidebarConfig.groups.reduce(
      (total, group) => total + group.items.length,
      0
    );
    const altItemsCount = alternativeSidebarConfig.groups.reduce(
      (total, group) => total + group.items.length,
      0
    );

    console.log(`📋 Default config has ${defaultItemsCount} menu items`);
    console.log(`📋 Alternative config has ${altItemsCount} menu items`);

    // Show roles summary
    const roles = ["admin", "employee"];
    console.log("\n👥 Role Access Summary:");
    roles.forEach((role) => {
      const defaultAccessCount = sampleSidebarConfig.groups.reduce(
        (total, group) => {
          return (
            total +
            group.items.filter((item) => item.roles.includes(role)).length
          );
        },
        0
      );
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
