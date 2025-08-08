#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../src/models/User";
import UserPermission, { IUserPermission } from "../src/models/UserPermission";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function checkEmployeeStatsPermissions() {
  try {
    console.log("🔍 Checking Employee Statistics Permissions...\n");

    // Lấy tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    for (const employee of employees) {
      console.log(`👤 Employee: ${employee.username} (${employee.email})`);

      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!permissions) {
        console.log("   ❌ No permissions record found");
        continue;
      }

      console.log(`   📋 Total permissions: ${permissions.permissions.length}`);

      // Kiểm tra các quyền quan trọng
      const requiredPermissions = [
        "view_dashboard",
        "view_statistics",
        "view_posts",
        "view_users",
      ];

      console.log("   🔐 Permission Check:");
      requiredPermissions.forEach((perm) => {
        const has = permissions.permissions.includes(perm);
        console.log(`      ${perm}: ${has ? "✅" : "❌"}`);
      });

      // Hiển thị tất cả permissions
      console.log("   📝 All permissions:");
      permissions.permissions.forEach((perm) => {
        console.log(`      - ${perm}`);
      });

      console.log("");
    }

    // Kiểm tra admin để so sánh
    console.log("👑 Admin Permissions for comparison:");
    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.username}`);
      const permissions = await UserPermission.findOne({ userId: admin._id });

      if (permissions) {
        const hasStats = permissions.permissions.includes("view_statistics");
        console.log(`   📊 view_statistics: ${hasStats ? "✅" : "❌"}`);
      } else {
        console.log("   ❌ No permissions record found");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

connectDb().then(() => {
  checkEmployeeStatsPermissions();
});
