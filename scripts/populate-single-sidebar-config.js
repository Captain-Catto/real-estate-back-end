const mongoose = require("mongoose");

// Kết nối MongoDB
const MONGODB_URI = "mongodb://localhost:27017/real-estate";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema cho SidebarConfig
const SidebarConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        path: { type: String, required: true },
        parentId: { type: String, default: null },
        order: { type: Number, required: true },
        isVisible: { type: Boolean, default: true },
        allowedRoles: [
          { type: String, enum: ["admin", "employee"], required: true },
        ],
        metadata: {
          isGroup: { type: Boolean, default: false },
          description: String,
        },
      },
    ],
    isDefault: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const SidebarConfig = mongoose.model("SidebarConfig", SidebarConfigSchema);

// Dữ liệu mặc định - chỉ 1 cấu hình duy nhất
const defaultSidebarData = {
  name: "Cấu hình Sidebar Mặc định",
  isDefault: true,
  items: [
    // Dashboard Group
    {
      id: "dashboard-group",
      title: "Tổng quan",
      path: "/admin/dashboard",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {
        isGroup: true,
        description: "Dashboard và thống kê tổng quan",
      },
    },
    {
      id: "dashboard",
      title: "Dashboard",
      path: "/admin",
      parentId: "dashboard-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { description: "Trang tổng quan hệ thống" },
    },
    {
      id: "stats",
      title: "Thống kê",
      path: "/admin/thong-ke",
      parentId: "dashboard-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Báo cáo và thống kê chi tiết" },
    },

    // Content Management Group
    {
      id: "content-group",
      title: "Quản lý nội dung",
      path: "/admin/content",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: {
        isGroup: true,
        description: "Quản lý tin đăng, tin tức và nội dung",
      },
    },
    {
      id: "posts",
      title: "Quản lý tin đăng",
      path: "/admin/quan-ly-tin-dang",
      parentId: "content-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { description: "Quản lý và duyệt tin đăng BĐS" },
    },
    {
      id: "news",
      title: "Quản lý tin tức",
      path: "/admin/quan-ly-tin-tuc",
      parentId: "content-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { description: "Quản lý bài viết tin tức" },
    },
    {
      id: "categories",
      title: "Danh mục BĐS",
      path: "/admin/quan-ly-danh-muc",
      parentId: "content-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý danh mục bất động sản" },
    },

    // User Management Group
    {
      id: "user-group",
      title: "Quản lý người dùng",
      path: "/admin/users",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        isGroup: true,
        description: "Quản lý người dùng, chủ đầu tư",
      },
    },
    {
      id: "users",
      title: "Người dùng",
      path: "/admin/quan-ly-nguoi-dung",
      parentId: "user-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý tài khoản người dùng" },
    },
    {
      id: "developers",
      title: "Chủ đầu tư",
      path: "/admin/quan-ly-chu-dau-tu",
      parentId: "user-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý thông tin chủ đầu tư" },
    },
    {
      id: "contact-management",
      title: "Liên hệ",
      path: "/admin/quan-ly-lien-he",
      parentId: "user-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin", "employee"],
      metadata: { description: "Quản lý yêu cầu liên hệ" },
    },

    // Data Management Group
    {
      id: "data-group",
      title: "Quản lý dữ liệu",
      path: "/admin/data",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        isGroup: true,
        description: "Quản lý địa chính, dự án, danh mục",
      },
    },
    {
      id: "projects",
      title: "Dự án",
      path: "/admin/quan-ly-du-an",
      parentId: "data-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý dự án bất động sản" },
    },
    {
      id: "locations",
      title: "Địa chính",
      path: "/admin/quan-ly-dia-chinh",
      parentId: "data-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý tỉnh thành, quận huyện" },
    },
    {
      id: "areas",
      title: "Diện tích",
      path: "/admin/quan-ly-dien-tich",
      parentId: "data-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý khoảng diện tích" },
    },
    {
      id: "prices",
      title: "Khoảng giá",
      path: "/admin/quan-ly-gia",
      parentId: "data-group",
      order: 4,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý khoảng giá BĐS" },
    },

    // Financial Group
    {
      id: "financial-group",
      title: "Tài chính",
      path: "/admin/financial",
      order: 5,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: {
        isGroup: true,
        description: "Quản lý giao dịch, thống kê tài chính",
      },
    },
    {
      id: "transactions",
      title: "Giao dịch",
      path: "/admin/quan-ly-giao-dich",
      parentId: "financial-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý giao dịch thanh toán" },
    },
    {
      id: "packages",
      title: "Gói tin đăng",
      path: "/admin/quan-ly-gia-tin-dang",
      parentId: "financial-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý gói và giá tin đăng" },
    },

    // System Settings Group
    {
      id: "system-group",
      title: "Cài đặt hệ thống",
      path: "/admin/system",
      order: 6,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { isGroup: true, description: "Cài đặt và cấu hình hệ thống" },
    },
    {
      id: "general-settings",
      title: "Cài đặt chung",
      path: "/admin/cai-dat",
      parentId: "system-group",
      order: 1,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Cài đặt tổng quan hệ thống" },
    },
    {
      id: "header-settings",
      title: "Cài đặt header",
      path: "/admin/cai-dat-header",
      parentId: "system-group",
      order: 2,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Cấu hình header trang web" },
    },
    {
      id: "sidebar-config",
      title: "Cấu hình Sidebar",
      path: "/admin/cau-hinh-sidebar",
      parentId: "system-group",
      order: 3,
      isVisible: true,
      allowedRoles: ["admin"],
      metadata: { description: "Quản lý cấu hình menu sidebar" },
    },
  ],
};

async function populateSidebarConfig() {
  try {
    console.log("🔄 Starting sidebar config population...");

    // Xóa tất cả config cũ
    await SidebarConfig.deleteMany({});
    console.log("🗑️  Cleared existing sidebar configs");

    // Tạo config mặc định
    const config = new SidebarConfig(defaultSidebarData);
    await config.save();

    console.log("✅ Created default sidebar config:");
    console.log(`   - Name: ${config.name}`);
    console.log(`   - Items: ${config.items.length}`);
    console.log(
      `   - Groups: ${
        config.items.filter((item) => item.metadata?.isGroup).length
      }`
    );
    console.log(
      `   - Menu items: ${
        config.items.filter((item) => !item.metadata?.isGroup).length
      }`
    );
    console.log(`   - ID: ${config._id}`);

    console.log("\n📊 Item breakdown:");
    const groups = config.items.filter((item) => item.metadata?.isGroup);
    groups.forEach((group) => {
      const children = config.items.filter(
        (item) => item.parentId === group.id
      );
      console.log(`   📁 ${group.title}: ${children.length} items`);
      children.forEach((child) => {
        console.log(`      - ${child.title} (${child.path})`);
      });
    });

    console.log("\n✅ Sidebar config population completed successfully!");
  } catch (error) {
    console.error("❌ Error populating sidebar config:", error);
    throw error;
  }
}

// Chạy script
populateSidebarConfig()
  .then(() => {
    console.log("\n🎉 All done! You can now use the sidebar config manager.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
