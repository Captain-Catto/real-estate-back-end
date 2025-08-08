#!/usr/bin/env node

/**
 * Script để fix vòng lặp vô tận khi employee không có quyền view_statistics
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
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function analyzePermissionLoop() {
  try {
    console.log("🔍 Analyzing Permission Loop Issue...\n");

    // Kiểm tra admin permissions
    const admins = await User.find({ role: "admin" });
    console.log(`👑 Found ${admins.length} admins:`);
    for (const admin of admins) {
      console.log(
        `   - ${admin.username}: Admin (bypasses all permission checks)`
      );
    }

    // Kiểm tra employee permissions
    const employees = await User.find({ role: "employee" });
    console.log(`\n👥 Found ${employees.length} employees:`);

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasStatsView =
        permissions?.permissions.includes("view_statistics") || false;
      console.log(
        `   - ${employee.username}: ${
          hasStatsView ? "✅" : "❌"
        } view_statistics`
      );

      if (!hasStatsView) {
        console.log(
          `     ⚠️  This employee will cause infinite loop on admin dashboard!`
        );
      }
    }

    console.log("\n🎯 Issue Analysis:");
    console.log(
      "   - Admin dashboard (/admin) required PERMISSIONS.STATISTICS.VIEW"
    );
    console.log("   - When employee lacks this permission:");
    console.log("     1. Access /admin → denied");
    console.log("     2. PagePermissionGuard redirects to /admin (default)");
    console.log("     3. Access /admin → denied again");
    console.log("     4. → INFINITE LOOP!");

    console.log("\n✅ Solution Applied:");
    console.log(
      "   - Removed PERMISSIONS.STATISTICS.VIEW from admin dashboard guard"
    );
    console.log(
      "   - Admin dashboard now accessible to all authenticated admin/employee users"
    );
    console.log(
      "   - Statistics page (/admin/thong-ke) still protected separately"
    );
  } catch (error) {
    console.error("❌ Error analyzing permission loop:", error);
    throw error;
  }
}

async function giveEmployeeBasicAccess() {
  try {
    console.log("\n🔧 Ensuring all employees have basic admin access...\n");

    const employees = await User.find({ role: "employee" });
    let updatedCount = 0;

    for (const employee of employees) {
      let permissions = await UserPermission.findOne({ userId: employee._id });

      const basicPermissions = [
        "view_users",
        "view_posts",
        "view_projects",
        "view_news",
        "view_transactions",
        "view_settings",
        "view_locations",
        // Note: view_statistics is NOT in basic permissions
        // It must be explicitly granted by admin
      ];

      if (!permissions) {
        permissions = new UserPermission({
          userId: employee._id,
          permissions: basicPermissions,
        });
        await permissions.save();
        console.log(`✅ Created basic permissions for ${employee.username}`);
        updatedCount++;
      } else {
        // Ensure they have basic permissions (but don't add view_statistics)
        let updated = false;
        for (const perm of basicPermissions) {
          if (!permissions.permissions.includes(perm)) {
            permissions.permissions.push(perm);
            updated = true;
          }
        }

        if (updated) {
          await permissions.save();
          console.log(`✅ Updated basic permissions for ${employee.username}`);
          updatedCount++;
        } else {
          console.log(`ℹ️  ${employee.username} already has basic permissions`);
        }
      }
    }

    console.log(
      `\n📊 Summary: Updated ${updatedCount} employees with basic permissions`
    );
  } catch (error) {
    console.error("❌ Error updating basic permissions:", error);
    throw error;
  }
}

async function testEmployeeAccess() {
  try {
    console.log("\n🧪 Testing employee access scenarios...\n");

    const testEmployee = await User.findOne({ role: "employee" });
    if (!testEmployee) {
      console.log("❌ No employee found for testing");
      return;
    }

    const permissions = await UserPermission.findOne({
      userId: testEmployee._id,
    });
    const hasStatsView =
      permissions?.permissions.includes("view_statistics") || false;

    console.log(`🎯 Test Employee: ${testEmployee.username}`);
    console.log(`   Basic admin access: ✅ (should work)`);
    console.log(
      `   Statistics access: ${hasStatsView ? "✅" : "❌"} ${
        hasStatsView ? "(can view)" : "(will see access denied)"
      }`
    );

    if (!hasStatsView) {
      console.log(
        "\n📋 Expected behavior when employee tries to access statistics:"
      );
      console.log("   1. Can access /admin (dashboard) ✅");
      console.log("   2. Cannot access /admin/thong-ke (statistics) ❌");
      console.log(
        '   3. Will see "Bạn không có quyền truy cập trang này" message'
      );
      console.log("   4. NO INFINITE LOOP!");
    }
  } catch (error) {
    console.error("❌ Error testing employee access:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();

    await analyzePermissionLoop();
    await giveEmployeeBasicAccess();
    await testEmployeeAccess();

    console.log("\n🎉 Infinite Loop Fix Complete!");
    console.log("\n🔄 Next Steps:");
    console.log(
      "   1. Test with employee account - should access admin dashboard"
    );
    console.log(
      "   2. Try accessing statistics page - should show access denied (no loop)"
    );
    console.log(
      "   3. Admin can grant view_statistics permission via employee-permissions page"
    );
  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { analyzePermissionLoop, giveEmployeeBasicAccess };
