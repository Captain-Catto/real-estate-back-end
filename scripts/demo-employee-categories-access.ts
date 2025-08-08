#!/usr/bin/env node

/**
 * Script test hoàn chỉnh cho tính năng manage_categories permission trong employee system
 */

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function demonstrateEmployeeCategoriesAccess() {
  try {
    console.log("🚀 DEMO: EMPLOYEE CATEGORIES PERMISSION SYSTEM\n");

    // Find an employee to demo with
    const employees = await User.find({ role: "employee" });
    if (employees.length === 0) {
      console.log(
        "❌ No employee accounts found. Please create an employee account first."
      );
      return;
    }

    const targetEmployee = employees[0];
    console.log(
      `🎯 Demo Employee: ${targetEmployee.username} (${targetEmployee.email})\n`
    );

    // Step 1: Show current permissions
    console.log("1️⃣ CURRENT EMPLOYEE PERMISSIONS:\n");
    let permissions = await UserPermission.findOne({
      userId: targetEmployee._id,
    });

    if (!permissions) {
      console.log("❌ Employee has no permission record");

      // Create basic permissions
      permissions = new UserPermission({
        userId: targetEmployee._id,
        permissions: [
          "view_users",
          "view_posts",
          "view_projects",
          "view_news",
          "view_dashboard",
          "view_settings",
          "view_locations",
        ],
      });
      await permissions.save();
      console.log("✅ Created basic permissions for employee");
    }

    const hasManageCategories =
      permissions.permissions.includes("manage_categories");
    console.log(`📋 Total permissions: ${permissions.permissions.length}`);
    console.log(
      `🏷️  Has manage_categories: ${hasManageCategories ? "✅ YES" : "❌ NO"}`
    );

    // Step 2: Simulate admin granting permission
    if (!hasManageCategories) {
      console.log("\n2️⃣ ADMIN GRANTS PERMISSION:\n");
      console.log("🔧 Admin is granting 'manage_categories' permission...");

      permissions.permissions.push("manage_categories");
      await permissions.save();

      console.log("✅ Permission granted successfully!");
    } else {
      console.log("\n2️⃣ PERMISSION ALREADY EXISTS:\n");
      console.log("ℹ️  Employee already has manage_categories permission");
    }

    // Step 3: Verify access
    console.log("\n3️⃣ ACCESS VERIFICATION:\n");

    const updatedPermissions = await UserPermission.findOne({
      userId: targetEmployee._id,
    });
    const canAccessCategories =
      updatedPermissions?.permissions.includes("manage_categories") || false;

    console.log(
      `🔍 Can access /admin/quan-ly-danh-muc: ${
        canAccessCategories ? "✅ YES" : "❌ NO"
      }`
    );

    if (canAccessCategories) {
      console.log("🎉 Employee can now:");
      console.log("   ✅ See 'Quản lý danh mục bất động sản' in admin sidebar");
      console.log("   ✅ Access category management page");
      console.log("   ✅ Create, edit, delete property categories");
      console.log("   ✅ Reorder categories");
    }

    // Step 4: Show what admin sees in employee permissions page
    console.log("\n4️⃣ ADMIN EMPLOYEE PERMISSIONS PAGE:\n");

    const manageablePermissions = [
      "create_user",
      "edit_user",
      "delete_user",
      "change_user_status",
      "create_post",
      "edit_post",
      "delete_post",
      "approve_post",
      "reject_post",
      "feature_post",
      "create_project",
      "edit_project",
      "delete_project",
      "create_news",
      "edit_news",
      "delete_news",
      "feature_news",
      "manage_news_categories",
      "view_transactions",
      "view_statistics",
      "export_statistics",
      "generate_reports",
      "edit_settings",
      "manage_categories",
      "manage_locations",
      "manage_areas",
      "manage_prices",
    ];

    console.log("📋 In 'Cài đặt hệ thống' section, admin will see:");
    const settingsPermissions = [
      "edit_settings",
      "manage_categories",
      "manage_locations",
      "manage_areas",
      "manage_prices",
    ];

    settingsPermissions.forEach((perm) => {
      const hasPermission =
        updatedPermissions?.permissions.includes(perm) || false;
      const description = getPermissionDescription(perm);
      console.log(`   ${hasPermission ? "✅" : "☐"} ${description} (${perm})`);
    });

    // Step 5: Usage instructions
    console.log("\n5️⃣ HOW TO TEST:\n");
    console.log("👤 FOR ADMIN:");
    console.log("   1. Login as admin");
    console.log("   2. Go to http://localhost:3000/admin/employee-permissions");
    console.log(`   3. Select employee: ${targetEmployee.username}`);
    console.log(
      "   4. Look for 'Quản lý danh mục bất động sản' in 'Cài đặt hệ thống'"
    );
    console.log("   5. Toggle it on/off and save");

    console.log("\n👷 FOR EMPLOYEE:");
    console.log(`   1. Login as: ${targetEmployee.username}`);
    console.log("   2. Go to http://localhost:3000/admin");
    console.log("   3. Look for 'Quản lý danh mục' in sidebar");
    console.log(
      "   4. Click to access http://localhost:3000/admin/quan-ly-danh-muc"
    );
    console.log("   5. Should see category management interface");

    console.log("\n🎉 DEMO COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }
}

function getPermissionDescription(permission: string): string {
  const descriptions: { [key: string]: string } = {
    edit_settings: "Chỉnh sửa cài đặt",
    manage_categories: "Quản lý danh mục bất động sản",
    manage_locations: "Quản lý địa điểm",
    manage_areas: "Quản lý khu vực",
    manage_prices: "Quản lý giá cả",
  };

  return descriptions[permission] || permission;
}

async function main() {
  await connectDb();
  await demonstrateEmployeeCategoriesAccess();
  await mongoose.disconnect();
  process.exit(0);
}

// Chạy script
if (require.main === module) {
  main();
}

export { demonstrateEmployeeCategoriesAccess };
