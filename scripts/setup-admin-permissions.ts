#!/usr/bin/env node

/**
 * Script để thêm quyền view_dashboard cho tất cả admins
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

async function addDashboardPermissionToAdmins() {
  try {
    console.log("🎯 Adding DASHBOARD.VIEW permission to all admins...\n");

    // Lấy tất cả admins
    const admins = await User.find({ role: "admin" });
    console.log(`👑 Found ${admins.length} admins`);

    let updatedCount = 0;

    for (const admin of admins) {
      const permissions = await UserPermission.findOne({
        userId: admin._id,
      });

      if (!permissions) {
        // Tạo permissions mới nếu chưa có (admins should have all permissions)
        const newPermissions = new UserPermission({
          userId: admin._id,
          permissions: [
            "view_dashboard",
            "view_statistics",
            "view_users",
            "view_posts",
            "view_projects",
            "view_news",
            "view_transactions",
            "view_settings",
            "view_locations",
            // Add more admin permissions as needed
          ],
        });
        await newPermissions.save();
        console.log(
          `✅ Created new permissions for admin ${admin.username} with full access`
        );
        updatedCount++;
      } else {
        // Thêm view_dashboard nếu chưa có
        let needsUpdate = false;

        if (!permissions.permissions.includes("view_dashboard")) {
          permissions.permissions.push("view_dashboard");
          needsUpdate = true;
        }

        if (!permissions.permissions.includes("view_statistics")) {
          permissions.permissions.push("view_statistics");
          needsUpdate = true;
        }

        if (needsUpdate) {
          await permissions.save();
          console.log(`✅ Updated permissions for admin ${admin.username}`);
          updatedCount++;
        } else {
          console.log(
            `ℹ️  ${admin.username} already has all required permissions`
          );
        }
      }
    }

    console.log(
      `\n📊 Summary: Updated ${updatedCount} admins with required permissions`
    );
    return updatedCount;
  } catch (error) {
    console.error("❌ Error adding admin permissions:", error);
    throw error;
  }
}

async function verifyAdminAccess() {
  try {
    console.log("\n🧪 Verifying admin access...\n");

    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      const permissions = await UserPermission.findOne({
        userId: admin._id,
      });

      const hasDashboard =
        permissions?.permissions.includes("view_dashboard") || false;
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      console.log(`👑 ${admin.username}:`);
      console.log(`   Dashboard access: ${hasDashboard ? "✅" : "❌"}`);
      console.log(`   Statistics access: ${hasStatistics ? "✅" : "❌"}`);
      console.log(
        `   Total permissions: ${permissions?.permissions.length || 0}`
      );

      if (hasDashboard && hasStatistics) {
        console.log(`   ✅ Full admin access - Perfect!`);
      } else {
        console.log(`   ⚠️  Missing some admin permissions`);
      }
      console.log();
    }
  } catch (error) {
    console.error("❌ Error verifying admin access:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();

    console.log("👑 Admin Permission Setup Script\n");
    console.log("This script will:");
    console.log("1. Add 'view_dashboard' permission to all admins");
    console.log("2. Add 'view_statistics' permission to all admins");
    console.log("3. Ensure admins have full system access\n");

    await addDashboardPermissionToAdmins();
    await verifyAdminAccess();

    console.log("🎉 Admin permission setup complete!");
    console.log("\n🔄 Summary:");
    console.log("✅ All admins should now have full access");
    console.log("✅ Dashboard and statistics permissions granted");
    console.log("✅ No access restrictions for admin users");
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

export { addDashboardPermissionToAdmins, verifyAdminAccess };
