import { config } from "dotenv";
import mongoose from "mongoose";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

// Load environment variables
config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Connect to database
const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

// Định nghĩa permissions mặc định cho từng role
const defaultPermissions = {
  admin: [
    // User management - full access
    "view_users",
    "create_user",
    "edit_user",
    "delete_user",
    "change_user_role",
    "change_user_status",
    "reset_user_password",
    "approve_user",

    // Post management - full access
    "view_posts",
    "edit_post",
    "delete_post",
    "approve_post",
    "reject_post",
    "view_deleted_posts",
    "restore_post",

    // Project management - full access
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",

    // News management - full access
    "view_news",
    "create_news",
    "edit_news",
    "delete_news",
    "feature_news",
    "manage_news_categories",

    // Transaction management - full access
    "view_transactions",
    "approve_transaction",
    "reject_transaction",
    "view_transaction_history",
    "create_refund",
    "generate_invoice",

    // Statistics - full access
    "view_statistics",
    "export_statistics",
    "generate_reports",
    "view_financial_stats",

    // Settings - full access
    "view_settings",
    "edit_settings",
    "manage_sidebar",
    "manage_header",

    // Location management - full access
    "view_locations",
    "manage_locations",
    "manage_areas",
    "manage_prices",

    // Permission management - admin only
    "manage_permissions",
    "view_all_permissions",
    "assign_permissions",
  ],

  employee: [
    // User management - limited access (chỉ xem)
    "view_users",

    // Post management - limited access
    "view_posts",
    "edit_post", // Employee có thể chỉnh sửa bài đăng

    // Project management - view only
    "view_projects",

    // News management - limited access
    "view_news",

    // Transaction management - view only
    "view_transactions",
    "view_transaction_history",

    // Dashboard - view only (trang chính admin)
    "view_dashboard",

    // Settings - view only
    "view_settings",

    // Location management - view only
    "view_locations",
  ],
};

// Permissions có thể được admin bật/tắt cho employee
const manageableEmployeePermissions = [
  // User management permissions cho employee
  "create_user",
  "edit_user",
  "delete_user",
  "change_user_status",

  // Post management permissions cho employee
  "delete_post",
  "approve_post",
  "reject_post",

  // Project management permissions cho employee
  "create_project",
  "edit_project",

  // News management permissions cho employee
  "create_news",
  "edit_news",
  "delete_news",
  "feature_news",
  "manage_news_categories",

  // Transaction management permissions cho employee
  "approve_transaction",
  "reject_transaction",

  // Dashboard và Statistics permissions cho employee
  "view_dashboard", // Quyền xem trang chính admin
  "view_statistics", // Quyền xem trang thống kê

  // Advanced statistics permissions cho employee
  "export_statistics",
  "generate_reports",

  // Settings permissions cho employee
  "edit_settings",
  "manage_categories",
  "manage_locations",
  "manage_areas",
  "manage_prices",
];

const populateUserPermissions = async () => {
  try {
    console.log("🚀 Starting user permissions population...");

    // Xóa tất cả permissions hiện tại
    await UserPermission.deleteMany({});
    console.log("🗑️  Cleared existing permissions");

    // Lấy tất cả users
    const users = await User.find({});
    console.log(`👥 Found ${users.length} users`);

    let adminCount = 0;
    let employeeCount = 0;
    let userCount = 0;

    // Tạo permissions cho từng user
    for (const user of users) {
      let permissions: string[] = [];

      switch (user.role) {
        case "admin":
          permissions = [...defaultPermissions.admin];
          adminCount++;
          break;

        case "employee":
          permissions = [...defaultPermissions.employee];
          employeeCount++;
          break;

        case "user":
          // User thông thường không có quyền admin
          permissions = [];
          userCount++;
          break;

        default:
          permissions = [];
          break;
      }

      // Tạo hoặc cập nhật UserPermission
      if (permissions.length > 0) {
        await UserPermission.findOneAndUpdate(
          { userId: user._id },
          {
            userId: user._id,
            permissions: permissions,
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        console.log(
          `✅ Created permissions for ${user.role}: ${user.username} (${permissions.length} permissions)`
        );
      }
    }

    console.log("\n📊 Permission Population Summary:");
    console.log(
      `👑 Admin users: ${adminCount} (${defaultPermissions.admin.length} permissions each)`
    );
    console.log(
      `👤 Employee users: ${employeeCount} (${defaultPermissions.employee.length} permissions each)`
    );
    console.log(`🔒 Regular users: ${userCount} (no admin permissions)`);

    console.log("\n📋 Available manageable permissions for employees:");
    console.log(
      manageableEmployeePermissions.map((p) => `  - ${p}`).join("\n")
    );

    console.log("\n✅ User permissions population completed successfully!");
  } catch (error) {
    console.error("❌ Error populating user permissions:", error);
    throw error;
  }
};

// Hàm để tạo sample employee users nếu chưa có
const createSampleUsers = async () => {
  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    const employeeCount = await User.countDocuments({ role: "employee" });

    console.log(
      `Current users: ${adminCount} admins, ${employeeCount} employees`
    );

    // Tạo admin mẫu nếu chưa có
    if (adminCount === 0) {
      const adminUser = new User({
        username: "admin",
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        status: "active",
      });
      await adminUser.save();
      console.log("✅ Created sample admin user");
    }

    // Tạo employee mẫu nếu chưa có
    if (employeeCount === 0) {
      const employeeUsers = [
        {
          username: "employee1",
          email: "employee1@example.com",
          password: "employee123",
          role: "employee",
          status: "active",
        },
        {
          username: "employee2",
          email: "employee2@example.com",
          password: "employee123",
          role: "employee",
          status: "active",
        },
      ];

      for (const userData of employeeUsers) {
        const employee = new User(userData);
        await employee.save();
        console.log(`✅ Created sample employee: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error("❌ Error creating sample users:", error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDb();

    // Tạo sample users nếu cần
    await createSampleUsers();

    // Populate permissions
    await populateUserPermissions();
  } catch (error) {
    console.error("❌ Script execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
};

// Run script
if (require.main === module) {
  main();
}

export { defaultPermissions, manageableEmployeePermissions };
