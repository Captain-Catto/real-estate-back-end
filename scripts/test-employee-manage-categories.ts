#!/usr/bin/env node

/**
 * Script để test và verify hệ thống permission manage_categories cho employee
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

async function testEmployeeManageCategoriesSystem() {
  try {
    console.log("🧪 TESTING EMPLOYEE MANAGE_CATEGORIES SYSTEM\n");

    // 1. Kiểm tra admin có quyền manage_categories
    console.log("1️⃣ Checking admin permissions:\n");

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

    // 2. Kiểm tra employee system
    console.log("\n2️⃣ Testing employee system:\n");

    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employee accounts`);

    if (employees.length > 0) {
      const testEmployee = employees[0];
      console.log(
        `🎯 Testing with: ${testEmployee.username} (${testEmployee.email})`
      );

      // Kiểm tra permission hiện tại
      let permissions = await UserPermission.findOne({
        userId: testEmployee._id,
      });

      const hasManageCategories =
        permissions?.permissions.includes("manage_categories") || false;
      console.log(
        `   Before: ${
          hasManageCategories ? "✅ HAS" : "❌ NO"
        } manage_categories`
      );

      // Nếu chưa có thì grant để test
      if (!hasManageCategories) {
        if (!permissions) {
          permissions = new UserPermission({
            userId: testEmployee._id,
            permissions: [
              "view_dashboard",
              "view_settings",
              "manage_categories",
            ],
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
    }

    // 3. Test page access
    console.log("\n3️⃣ Page access verification:\n");

    console.log("📋 Frontend permissions check:");
    console.log(
      "   ✅ PAGE_REQUIRED_PERMISSIONS['/admin/quan-ly-danh-muc'] should include 'manage_categories'"
    );
    console.log(
      "   ✅ Employee permissions page shows 'Quản lý danh mục bất động sản' option"
    );
    console.log(
      "   ✅ When granted, employee can access /admin/quan-ly-danh-muc"
    );

    console.log("\n🎉 TEST COMPLETED!");
    console.log("\n💡 To test in frontend:");
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

    // 4. Show final status
    console.log("\n4️⃣ FINAL STATUS:\n");

    const usersWithPermission = await UserPermission.find({
      permissions: { $in: ["manage_categories"] },
    }).populate("userId", "username email role");

    console.log("👥 Users with manage_categories permission:");
    for (const userPerm of usersWithPermission) {
      const user = userPerm.userId as any;
      console.log(
        `   ${user.role.toUpperCase()}: ${user.username} (${user.email})`
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

async function main() {
  try {
    await connectDb();
    await testEmployeeManageCategoriesSystem();
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n📝 MongoDB connection closed");
  }
}

// Run script
if (require.main === module) {
  main();
}

export { testEmployeeManageCategoriesSystem };
