#!/usr/bin/env node

/**
 * Script để fix vòng lặp vô tận và restore quyền view_statistics cho employee để test
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

async function restoreEmployeeStatsPermissions() {
  try {
    console.log("🔧 Restoring view_statistics permission for employees...\n");

    // Lấy tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    let updatedCount = 0;

    for (const employee of employees) {
      console.log(`👤 Processing ${employee.username} (${employee.email})`);

      // Tìm UserPermission record
      let permissions = await UserPermission.findOne({ userId: employee._id });

      if (!permissions) {
        // Tạo mới với quyền cơ bản
        permissions = new UserPermission({
          userId: employee._id,
          permissions: [
            "view_users",
            "view_posts",
            "view_projects",
            "view_news",
            "view_transactions",
            "view_statistics", // Thêm lại quyền này
            "view_settings",
            "view_locations",
          ],
        });
        await permissions.save();
        console.log("   ✅ Created new permissions with view_statistics");
        updatedCount++;
      } else {
        // Kiểm tra và thêm view_statistics nếu chưa có
        if (!permissions.permissions.includes("view_statistics")) {
          permissions.permissions.push("view_statistics");
          await permissions.save();
          console.log("   ✅ Added view_statistics permission");
          updatedCount++;
        } else {
          console.log("   ℹ️  Already has view_statistics permission");
        }
      }
    }

    console.log(`\n📊 Summary: Updated ${updatedCount} employees`);

    // Verify
    console.log("\n🔍 Verifying permissions...\n");
    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasStats =
        permissions?.permissions.includes("view_statistics") || false;
      console.log(
        `👤 ${employee.username}: ${hasStats ? "✅" : "❌"} view_statistics`
      );
    }
  } catch (error) {
    console.error("❌ Error restoring permissions:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await restoreEmployeeStatsPermissions();
    console.log("\n🎉 Successfully restored employee permissions!");
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

export { restoreEmployeeStatsPermissions };
