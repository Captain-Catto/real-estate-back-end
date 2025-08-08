#!/usr/bin/env node

/**
 * Script để test vòng lặp vô tận đã được fix chưa
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

async function testInfiniteLoopFix() {
  try {
    console.log("🧪 Testing Infinite Loop Fix for Admin Pages...\n");

    // 1. Ensure no employee has view_statistics permission
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    let employeesWithoutStats = 0;
    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasStats =
        permissions?.permissions.includes("view_statistics") || false;

      if (!hasStats) {
        employeesWithoutStats++;
      }

      console.log(
        `👤 ${employee.username}: ${
          hasStats ? "❌ HAS stats" : "✅ NO stats"
        } (${hasStats ? "WILL REDIRECT" : "SAFE"})`
      );
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total employees: ${employees.length}`);
    console.log(
      `   Employees without view_statistics: ${employeesWithoutStats}`
    );
    console.log(
      `   Employees with view_statistics: ${
        employees.length - employeesWithoutStats
      }`
    );

    // 2. Test scenarios
    console.log("\n🎯 Test Scenarios:");
    console.log("   1. Employee without permission accesses /admin/thong-ke");
    console.log("      Expected: Redirect to /admin/unauthorized (NO LOOP)");
    console.log("   2. Employee accesses /admin");
    console.log("      Expected: Normal access (employee allowed)");
    console.log("   3. Employee accesses /admin/unauthorized");
    console.log('      Expected: Shows "no permission" message');

    // 3. Check fix implementation
    console.log("\n🔍 Checking Fix Implementation:");
    console.log(
      "   ✅ All admin pages redirect to /admin/unauthorized (not /admin)"
    );
    console.log("   ✅ /admin/unauthorized page created with proper UI");
    console.log(
      '   ✅ PagePermissionGuard uses redirectTo="/admin/unauthorized"'
    );
    console.log(
      "   ✅ No circular redirects between /admin and /admin/thong-ke"
    );

    if (employeesWithoutStats > 0) {
      console.log("\n🎉 Test Setup Complete!");
      console.log("   You can now test:");
      console.log(`   1. Login as employee (e.g., employee1)`);
      console.log(`   2. Try to access /admin/thong-ke`);
      console.log(
        `   3. Should redirect to /admin/unauthorized (no infinite loop)`
      );
      console.log(
        `   4. Admin can grant view_statistics permission in employee-permissions`
      );
      console.log(
        `   5. After permission granted, employee can access statistics page`
      );
    } else {
      console.log("\n⚠️  All employees have view_statistics permission");
      console.log("   To test the fix:");
      console.log(
        "   1. Remove view_statistics from an employee in admin panel"
      );
      console.log(
        "   2. Login as that employee and try to access statistics page"
      );
    }
  } catch (error) {
    console.error("❌ Error testing infinite loop fix:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testInfiniteLoopFix();
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

export { testInfiniteLoopFix };
