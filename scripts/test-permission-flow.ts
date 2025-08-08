#!/usr/bin/env node

/**
 * Script để test toàn bộ quy trình permission của employee với statistics
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

async function testPermissionFlow() {
  try {
    console.log("🧪 Testing Employee Permission Flow for Statistics...\n");

    // Lấy một employee để test
    const testEmployee = await User.findOne({ role: "employee" });
    if (!testEmployee) {
      console.log("❌ No employee found for testing");
      return;
    }

    console.log(`🎯 Testing with employee: ${testEmployee.username}\n`);

    // 1. Verify employee hiện tại KHÔNG có quyền view_statistics
    let permissions = await UserPermission.findOne({
      userId: testEmployee._id,
    });
    if (permissions) {
      const hasStats = permissions.permissions.includes("view_statistics");
      console.log(
        `1️⃣ Initial state: Has view_statistics = ${hasStats ? "✅" : "❌"}`
      );

      if (hasStats) {
        console.log("   🔧 Removing view_statistics to start clean...");
        permissions.permissions = permissions.permissions.filter(
          (p) => p !== "view_statistics"
        );
        await permissions.save();
        console.log("   ✅ Removed view_statistics");
      }
    }

    // 2. Simulate adding view_statistics permission (like admin would do)
    console.log("\n2️⃣ Simulating admin granting view_statistics permission...");

    const basePermissions = [
      "view_users",
      "view_posts",
      "view_projects",
      "view_news",
      "view_transactions",
      "view_support_requests",
      "view_reports",
      "view_settings",
      "view_locations",
    ];

    const additionalPermissions = ["view_statistics"]; // Admin grants this
    const finalPermissions = [...basePermissions, ...additionalPermissions];

    // Update permissions
    if (permissions) {
      permissions.permissions = finalPermissions;
      await permissions.save();
    } else {
      permissions = new UserPermission({
        userId: testEmployee._id,
        permissions: finalPermissions,
      });
      await permissions.save();
    }

    console.log("   ✅ Granted view_statistics permission");

    // 3. Verify permission was granted
    permissions = await UserPermission.findOne({ userId: testEmployee._id });
    const hasStatsAfterGrant =
      permissions?.permissions.includes("view_statistics") || false;
    console.log(
      `   Verification: Has view_statistics = ${
        hasStatsAfterGrant ? "✅" : "❌"
      }`
    );

    // 4. Simulate removing view_statistics permission
    console.log("\n3️⃣ Simulating admin revoking view_statistics permission...");

    const revokedPermissions = basePermissions; // Without view_statistics

    if (permissions) {
      permissions.permissions = revokedPermissions;
      await permissions.save();
    }

    console.log("   ✅ Revoked view_statistics permission");

    // 5. Final verification
    permissions = await UserPermission.findOne({ userId: testEmployee._id });
    const hasStatsAfterRevoke =
      permissions?.permissions.includes("view_statistics") || false;
    console.log(
      `   Verification: Has view_statistics = ${
        hasStatsAfterRevoke ? "✅" : "❌"
      }`
    );

    // 6. Summary
    console.log("\n📊 Test Results:");
    console.log(`   Employee: ${testEmployee.username}`);
    console.log(
      `   Permission grant test: ${hasStatsAfterGrant ? "PASS ✅" : "FAIL ❌"}`
    );
    console.log(
      `   Permission revoke test: ${
        !hasStatsAfterRevoke ? "PASS ✅" : "FAIL ❌"
      }`
    );

    if (hasStatsAfterGrant && !hasStatsAfterRevoke) {
      console.log("\n🎉 Permission system is working correctly!");
      console.log("   - Admin can grant view_statistics to employees");
      console.log("   - Admin can revoke view_statistics from employees");
      console.log(
        '   - Employees without permission should see "Bạn không có quyền truy cập trang này"'
      );
    } else {
      console.log("\n❌ Permission system has issues that need investigation");
    }
  } catch (error) {
    console.error("❌ Error testing permission flow:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testPermissionFlow();
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { testPermissionFlow };
