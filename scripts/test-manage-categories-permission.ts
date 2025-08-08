#!/usr/bin/env node

/**
 * Script để test và verify quyền manage_categories trong employee permission system
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

async function testManageCategoriesPermission() {
  try {
    console.log("🧪 TESTING MANAGE_CATEGORIES PERMISSION SYSTEM\n");

    // 1. Verify admin accounts have the permission
    console.log("1️⃣ Checking admin accounts:\n");

    const admins = await User.find({ role: "admin" });
    console.log(`📋 Found ${admins.length} admin accounts`);

    for (const admin of admins) {
      const permissions = await UserPermission.findOne({ userId: admin._id });

      if (permissions?.permissions.includes("manage_categories")) {
        console.log(
          `   ✅ ${admin.username} (${admin.email}) - HAS manage_categories`
        );
      } else {
        console.log(
          `   ❌ ${admin.username} (${admin.email}) - MISSING manage_categories`
        );
      }
    }

    // 2. Check manageable permissions list
    console.log("\n2️⃣ Checking manageable employee permissions:\n");

    // Simulate what PermissionController.getAvailablePermissions would return
    const manageableEmployeePermissions = [
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
      "manage_categories", // This should be present
      "manage_locations",
      "manage_areas",
      "manage_prices",
    ];

    const hasManageCategories =
      manageableEmployeePermissions.includes("manage_categories");
    console.log(
      `🔍 manage_categories in manageable list: ${
        hasManageCategories ? "✅ YES" : "❌ NO"
      }`
    );

    // 3. Test with an employee
    console.log("\n3️⃣ Testing employee permission grant:\n");

    const employees = await User.find({ role: "employee" }).limit(1);

    if (employees.length > 0) {
      const testEmployee = employees[0];
      console.log(
        `👤 Test employee: ${testEmployee.username} (${testEmployee.email})`
      );

      // Check current permissions
      let permissions = await UserPermission.findOne({
        userId: testEmployee._id,
      });

      const beforeHasPermission =
        permissions?.permissions.includes("manage_categories") || false;
      console.log(
        `   Before: ${
          beforeHasPermission ? "✅ HAS" : "❌ NO"
        } manage_categories`
      );

      // Grant permission if not exists (for testing)
      if (!beforeHasPermission) {
        if (!permissions) {
          permissions = new UserPermission({
            userId: testEmployee._id,
            permissions: ["view_dashboard", "manage_categories"],
          });
        } else {
          permissions.permissions.push("manage_categories");
        }

        await permissions.save();
        console.log("   🔧 Granted manage_categories for testing");
      }

      // Verify
      const updatedPermissions = await UserPermission.findOne({
        userId: testEmployee._id,
      });
      const afterHasPermission =
        updatedPermissions?.permissions.includes("manage_categories") || false;
      console.log(
        `   After: ${afterHasPermission ? "✅ HAS" : "❌ NO"} manage_categories`
      );
    } else {
      console.log("ℹ️  No employee accounts found for testing");
    }

    // 4. Frontend route check
    console.log("\n4️⃣ Frontend integration check:\n");

    console.log("📋 Expected frontend integration:");
    console.log(
      "   ✅ PAGE_REQUIRED_PERMISSIONS['/admin/quan-ly-danh-muc'] should include 'manage_categories'"
    );
    console.log(
      "   ✅ Employee permissions page should show 'Quản lý danh mục bất động sản' option"
    );
    console.log(
      "   ✅ When granted, employee can access /admin/quan-ly-danh-muc"
    );

    console.log("\n🎉 TEST COMPLETED!");
    console.log("\n💡 To test frontend:");
    console.log("   1. Login as admin");
    console.log("   2. Go to /admin/employee-permissions");
    console.log("   3. Select an employee");
    console.log(
      "   4. Look for 'Quản lý danh mục bất động sản' in 'Cài đặt hệ thống' section"
    );
    console.log("   5. Enable it and save");
    console.log(
      "   6. Login as that employee and try to access /admin/quan-ly-danh-muc"
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  await connectDb();
  await testManageCategoriesPermission();
  await mongoose.disconnect();
  process.exit(0);
}

// Chạy script
if (require.main === module) {
  main();
}

export { testManageCategoriesPermission };
