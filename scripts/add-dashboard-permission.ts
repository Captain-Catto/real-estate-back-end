#!/usr/bin/env node

/**
 * Script để thêm quyền view_dashboard cho tất cả employees
 * Điều này sẽ cho phép employee truy cập trang admin dashboard chính
 * mà không cần quyền view_statistics
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

async function addDashboardPermission() {
  try {
    console.log("🎯 Adding DASHBOARD.VIEW permission to all employees...\n");

    // Lấy tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees`);

    let updatedCount = 0;

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!permissions) {
        // Tạo permissions mới nếu chưa có
        const newPermissions = new UserPermission({
          userId: employee._id,
          permissions: ["view_dashboard"],
        });
        await newPermissions.save();
        console.log(
          `✅ Created new permissions for ${employee.username} with view_dashboard`
        );
        updatedCount++;
      } else {
        // Thêm view_dashboard nếu chưa có
        if (!permissions.permissions.includes("view_dashboard")) {
          permissions.permissions.push("view_dashboard");
          await permissions.save();
          console.log(
            `✅ Added view_dashboard permission to ${employee.username}`
          );
          updatedCount++;
        } else {
          console.log(
            `ℹ️  ${employee.username} already has view_dashboard permission`
          );
        }
      }
    }

    console.log(
      `\n📊 Summary: Updated ${updatedCount} employees with view_dashboard permission`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error adding dashboard permission:", error);
    throw error;
  }
}

async function verifyDashboardAccess() {
  try {
    console.log("\n🧪 Verifying dashboard access for employees...\n");

    const employees = await User.find({ role: "employee" });

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      const hasDashboard =
        permissions?.permissions.includes("view_dashboard") || false;
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      console.log(`🎯 ${employee.username}:`);
      console.log(`   Dashboard access: ${hasDashboard ? "✅" : "❌"}`);
      console.log(`   Statistics access: ${hasStatistics ? "✅" : "❌"}`);

      if (hasDashboard && !hasStatistics) {
        console.log(
          `   ✅ Perfect! Can access admin dashboard but not statistics page`
        );
      } else if (hasDashboard && hasStatistics) {
        console.log(`   ✅ Full access to both dashboard and statistics`);
      } else if (!hasDashboard) {
        console.log(`   ⚠️  No dashboard access - this will cause issues!`);
      }
      console.log();
    }
  } catch (error) {
    console.error("❌ Error verifying dashboard access:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();

    console.log("🚀 Dashboard Permission Addition Script\n");
    console.log("This script will:");
    console.log("1. Add 'view_dashboard' permission to all employees");
    console.log("2. Allow employees to access /admin page");
    console.log("3. Keep statistics access separate (view_statistics)\n");

    await addDashboardPermission();
    await verifyDashboardAccess();

    console.log("🎉 Dashboard permission addition complete!");
    console.log("\n🔄 Next Steps:");
    console.log("1. Test employee login - should now access admin dashboard");
    console.log(
      "2. Try accessing /admin/thong-ke - needs view_statistics permission"
    );
    console.log("3. Admin can grant view_statistics separately if needed");
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { addDashboardPermission, verifyDashboardAccess };
