#!/usr/bin/env node

/**
 * Script để debug permission system - kiểm tra tại sao employee vẫn truy cập được
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

async function debugPermissionSystem() {
  try {
    console.log("🔍 Debug Permission System - Employee Statistics Access...\n");

    // 1. Kiểm tra tất cả employees và permissions chi tiết
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    for (const employee of employees) {
      console.log(`👤 Employee: ${employee.username} (${employee.email})`);
      console.log(`   ID: ${employee._id}`);
      console.log(`   Role: ${employee.role}`);
      console.log(`   Status: ${employee.status}`);

      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      if (permissions) {
        console.log(`   Permission Record ID: ${permissions._id}`);
        console.log(`   Total Permissions: ${permissions.permissions.length}`);
        console.log(
          `   Has view_statistics: ${
            permissions.permissions.includes("view_statistics") ? "✅" : "❌"
          }`
        );
        console.log(
          `   All permissions: ${permissions.permissions.join(", ")}`
        );
      } else {
        console.log(`   ❌ NO PERMISSION RECORD FOUND!`);
      }
      console.log("");
    }

    // 2. Kiểm tra admins để so sánh
    const admins = await User.find({ role: "admin" });
    console.log(`👑 Found ${admins.length} admins\n`);

    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.username} (${admin.email})`);
      console.log(`   Role: ${admin.role} (Should have full access)`);
      console.log("");
    }

    // 3. Kiểm tra tất cả UserPermission records
    const allPermissions = await UserPermission.find({}).populate("userId");
    console.log(`📋 Total UserPermission records: ${allPermissions.length}\n`);

    for (const perm of allPermissions) {
      const user = perm.userId as any;
      if (user && user.role === "employee") {
        console.log(`🔧 UserPermission Record:`);
        console.log(`   User: ${user.username} (${user.role})`);
        console.log(`   Record ID: ${perm._id}`);
        console.log(`   Permissions: ${perm.permissions.join(", ")}`);
        console.log(
          `   Has view_statistics: ${
            perm.permissions.includes("view_statistics") ? "✅" : "❌"
          }`
        );
        console.log("");
      }
    }

    // 4. Kiểm tra duplicate records
    const userIds = allPermissions.map((p) => p.userId.toString());
    const duplicates = userIds.filter(
      (id, index) => userIds.indexOf(id) !== index
    );
    if (duplicates.length > 0) {
      console.log(`⚠️  FOUND DUPLICATE PERMISSION RECORDS:`);
      for (const dupId of [...new Set(duplicates)]) {
        const user = await User.findById(dupId);
        const perms = await UserPermission.find({ userId: dupId });
        console.log(
          `   User: ${user?.username} has ${perms.length} permission records`
        );
        perms.forEach((p, i) => {
          console.log(`     Record ${i + 1}: ${p.permissions.join(", ")}`);
        });
      }
      console.log("");
    }
  } catch (error) {
    console.error("❌ Error debugging permission system:", error);
    throw error;
  }
}

async function testSpecificEmployee(username: string) {
  try {
    console.log(`🎯 Testing specific employee: ${username}\n`);

    const employee = await User.findOne({ username, role: "employee" });
    if (!employee) {
      console.log(`❌ Employee '${username}' not found`);
      return;
    }

    console.log(`👤 Found employee: ${employee.username}`);
    console.log(`   ID: ${employee._id}`);
    console.log(`   Email: ${employee.email}`);
    console.log(`   Status: ${employee.status}`);

    const permissions = await UserPermission.find({ userId: employee._id });
    console.log(`   Permission records found: ${permissions.length}`);

    permissions.forEach((perm, index) => {
      console.log(`   Record ${index + 1}:`);
      console.log(`     ID: ${perm._id}`);
      console.log(`     Permissions: ${perm.permissions.join(", ")}`);
      console.log(
        `     Has view_statistics: ${
          perm.permissions.includes("view_statistics") ? "✅" : "❌"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Error testing specific employee:", error);
  }
}

async function removeViewStatisticsFromAllEmployees() {
  try {
    console.log(
      "🔧 Removing view_statistics permission from ALL employees...\n"
    );

    const employees = await User.find({ role: "employee" });
    let updatedCount = 0;

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      if (permissions && permissions.permissions.includes("view_statistics")) {
        permissions.permissions = permissions.permissions.filter(
          (p) => p !== "view_statistics"
        );
        await permissions.save();
        console.log(`✅ Removed view_statistics from ${employee.username}`);
        updatedCount++;
      }
    }

    console.log(
      `\n📊 Summary: Removed view_statistics from ${updatedCount} employees`
    );
  } catch (error) {
    console.error("❌ Error removing permissions:", error);
  }
}

async function main() {
  try {
    await connectDb();

    // Debug toàn bộ hệ thống
    await debugPermissionSystem();

    // Test employee cụ thể (thay đổi username nếu cần)
    // await testSpecificEmployee('employee1');

    // Uncomment dòng dưới để remove view_statistics từ tất cả employees
    // await removeViewStatisticsFromAllEmployees();
  } catch (error) {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export {
  debugPermissionSystem,
  testSpecificEmployee,
  removeViewStatisticsFromAllEmployees,
};
