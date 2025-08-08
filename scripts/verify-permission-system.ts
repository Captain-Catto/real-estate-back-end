#!/usr/bin/env node

/**
 * Script để test và verify hệ thống permission hoàn chỉnh
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

async function testPermissionSystem() {
  try {
    console.log("🔍 Testing Permission System...\n");

    // 1. Kiểm tra tất cả employees có quyền view_statistics
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      if (permissions) {
        const hasStatsView =
          permissions.permissions.includes("view_statistics");
        console.log(
          `👤 ${employee.username}: ${
            hasStatsView ? "✅" : "❌"
          } view_statistics`
        );

        if (!hasStatsView) {
          console.log("   🔧 Adding missing view_statistics permission...");
          permissions.permissions.push("view_statistics");
          await permissions.save();
          console.log("   ✅ Added view_statistics permission");
        }
      } else {
        console.log(
          `👤 ${employee.username}: ❌ No permissions found - creating...`
        );
        const newPermissions = new UserPermission({
          userId: employee._id,
          permissions: [
            "view_users",
            "view_posts",
            "view_projects",
            "view_news",
            "view_transactions",
            "view_statistics", // Đảm bảo có quyền này
            "view_settings",
            "view_locations",
          ],
        });
        await newPermissions.save();
        console.log("   ✅ Created permissions with view_statistics");
      }
    }

    // 2. Verify lại sau khi fix
    console.log("\n🔍 Final verification...\n");
    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasStatsView =
        permissions?.permissions.includes("view_statistics") || false;
      console.log(
        `👤 ${employee.username}: ${hasStatsView ? "✅" : "❌"} view_statistics`
      );
    }

    // 3. Kiểm tra admin
    const admins = await User.find({ role: "admin" });
    console.log(`\n👑 Found ${admins.length} admins`);
    for (const admin of admins) {
      console.log(`👤 ${admin.username}: ✅ Admin (full access)`);
    }

    console.log("\n📊 Summary:");
    console.log(`   Total employees: ${employees.length}`);
    console.log(`   Total admins: ${admins.length}`);
    console.log("   All employees should have view_statistics permission ✅");
  } catch (error) {
    console.error("❌ Error testing permission system:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testPermissionSystem();
    console.log("\n🎉 Permission system test completed successfully!");
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

export { testPermissionSystem };
