#!/usr/bin/env node

/**
 * Script test permission system - kiểm tra tất cả employee permissions
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

// Expected permissions for employees based on frontend constants
const EXPECTED_EMPLOYEE_PERMISSIONS = [
  "view_users",
  "create_user",
  "edit_user",
  "delete_user",
  "change_user_status",
  "reset_user_password",
  "view_posts",
  "edit_post",
  "approve_post",
  "reject_post",
  "view_projects",
  "edit_project",
  "view_news",
  "create_news",
  "edit_news",
  "feature_news",
  "publish_news",
  "view_statistics", // Key permission for accessing stats page
  "view_locations",
];

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function testEmployeePermissions() {
  try {
    console.log("🔍 Testing Employee Permission System...\n");

    // Get all employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    let allTestsPassed = true;

    for (const employee of employees) {
      console.log(`🧪 Testing ${employee.username} (${employee.email})`);

      // Get employee permissions
      const userPermission = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!userPermission) {
        console.log(`   ❌ No permission record found`);
        allTestsPassed = false;
        continue;
      }

      // Check each expected permission
      const missingPermissions: string[] = [];
      const extraPermissions: string[] = [];

      for (const permission of EXPECTED_EMPLOYEE_PERMISSIONS) {
        if (!userPermission.permissions.includes(permission)) {
          missingPermissions.push(permission);
        }
      }

      // Check for extra permissions (not in expected list)
      for (const permission of userPermission.permissions) {
        if (!EXPECTED_EMPLOYEE_PERMISSIONS.includes(permission)) {
          extraPermissions.push(permission);
        }
      }

      // Report results
      if (missingPermissions.length === 0 && extraPermissions.length === 0) {
        console.log(
          `   ✅ All permissions correct (${userPermission.permissions.length} total)`
        );
      } else {
        console.log(`   ⚠️  Permission issues found:`);
        if (missingPermissions.length > 0) {
          console.log(`      Missing: ${missingPermissions.join(", ")}`);
          allTestsPassed = false;
        }
        if (extraPermissions.length > 0) {
          console.log(`      Extra: ${extraPermissions.join(", ")}`);
        }
      }

      // Specifically check statistics permission
      const hasStatsPermission =
        userPermission.permissions.includes("view_statistics");
      console.log(
        `   📊 Statistics permission: ${
          hasStatsPermission ? "✅ YES" : "❌ NO"
        }`
      );

      if (!hasStatsPermission) {
        allTestsPassed = false;
      }

      console.log("");
    }

    // Summary
    console.log("📝 Test Summary:");
    if (allTestsPassed) {
      console.log(
        "🎉 ALL TESTS PASSED! Employee permission system is working correctly."
      );
      console.log(
        "✅ All employees should be able to access the statistics page."
      );
    } else {
      console.log(
        "❌ SOME TESTS FAILED! Employee permissions need to be fixed."
      );
      console.log("🔧 Run the fix script to update permissions.");
    }
  } catch (error) {
    console.error("❌ Error testing permissions:", error);
    throw error;
  }
}

async function testAdminAccess() {
  try {
    console.log("\n🔍 Testing Admin Access...\n");

    const admins = await User.find({ role: "admin" });
    console.log(`👑 Found ${admins.length} admins`);

    for (const admin of admins) {
      console.log(`👑 Admin: ${admin.username} (${admin.email})`);
      const adminPermissions = await UserPermission.findOne({
        userId: admin._id,
      });

      if (adminPermissions) {
        console.log(
          `   📋 Has ${adminPermissions.permissions.length} explicit permissions`
        );
      } else {
        console.log(`   📋 No explicit permissions (admin has all by default)`);
      }
    }
  } catch (error) {
    console.error("❌ Error testing admin access:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await testEmployeePermissions();
    await testAdminAccess();
  } catch (error) {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the test
main();

export { testEmployeePermissions };
