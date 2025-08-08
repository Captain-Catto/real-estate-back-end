#!/usr/bin/env node

/**
 * Script để debug permission issues với trang quản lý giá
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
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  }
}

async function debugPriceManagementPermissions() {
  try {
    console.log("🧪 DEBUGGING PRICE MANAGEMENT PERMISSIONS\n");

    // Required permission cho trang quản lý giá
    const requiredPermission = "manage_prices"; // PERMISSIONS.LOCATION.MANAGE_PRICES

    console.log(`📋 Required permission: "${requiredPermission}"\n`);

    // Kiểm tra tất cả users
    console.log("👥 CHECKING ALL USERS:\n");

    const users = await User.find({}).limit(10);

    for (const user of users) {
      console.log(
        `👤 ${user.role.toUpperCase()}: ${user.username} (${user.email})`
      );

      const permissions = await UserPermission.findOne({ userId: user._id });

      if (!permissions) {
        console.log(`   ❌ No permission record found`);

        if (user.role === "admin") {
          console.log(`   ⚠️  ADMIN WITHOUT PERMISSIONS - This is a problem!`);
        }

        console.log("");
        continue;
      }

      const userPermissions = permissions.permissions || [];
      const hasRequiredPermission =
        userPermissions.includes(requiredPermission);

      console.log(`   📊 Total permissions: ${userPermissions.length}`);
      console.log(
        `   🔑 Has "${requiredPermission}": ${
          hasRequiredPermission ? "✅ YES" : "❌ NO"
        }`
      );

      if (!hasRequiredPermission && user.role === "admin") {
        console.log(`   🚨 ADMIN MISSING REQUIRED PERMISSION!`);
      }

      if (!hasRequiredPermission && user.role === "employee") {
        console.log(
          `   ℹ️  Employee should not have this permission (expected)`
        );
      }

      // Show first few permissions for context
      if (userPermissions.length > 0) {
        const firstFew = userPermissions.slice(0, 5);
        console.log(
          `   📝 Sample permissions: [${firstFew.join(", ")}]${
            userPermissions.length > 5 ? "..." : ""
          }`
        );
      }

      console.log("");
    }

    // Kiểm tra ai có quyền manage_prices
    console.log("🔍 USERS WITH MANAGE_PRICES PERMISSION:\n");

    const usersWithPermission = await UserPermission.find({
      permissions: { $in: [requiredPermission] },
    });

    if (usersWithPermission.length === 0) {
      console.log("❌ NO USERS HAVE MANAGE_PRICES PERMISSION!");
      console.log("🔧 This might be why you're seeing the countdown page.\n");
    } else {
      console.log(
        `✅ Found ${usersWithPermission.length} users with required permission:\n`
      );

      for (const userPerm of usersWithPermission) {
        const user = await User.findById(userPerm.userId);
        if (user) {
          console.log(
            `   ✅ ${user.role.toUpperCase()}: ${user.username} (${user.email})`
          );
        }
      }
    }

    // Đề xuất giải pháp
    console.log("\n💡 SOLUTIONS:\n");

    if (usersWithPermission.length === 0) {
      console.log("1. Add manage_prices permission to admin users:");
      console.log(
        "   cd scripts && npx tsx add-price-management-permission.ts\n"
      );

      console.log("2. Or temporarily change page permission requirement:");
      console.log(
        "   Change PERMISSIONS.LOCATION.MANAGE_PRICES to PERMISSIONS.SETTINGS.VIEW\n"
      );
    }

    console.log("3. Check frontend permission constant:");
    console.log(
      "   Verify PERMISSIONS.LOCATION.MANAGE_PRICES = 'manage_prices'\n"
    );
  } catch (error) {
    console.error("❌ Error debugging permissions:", error);
  }
}

async function fixPriceManagementPermissions() {
  try {
    console.log("🔧 FIXING PRICE MANAGEMENT PERMISSIONS\n");

    // Add manage_prices to all admins
    const admins = await User.find({ role: "admin" });
    let fixedCount = 0;

    for (const admin of admins) {
      const permissions = await UserPermission.findOne({ userId: admin._id });

      if (!permissions) {
        // Create permissions for admin
        const newPermissions = new UserPermission({
          userId: admin._id,
          permissions: [
            "manage_prices", // Add the required permission
            "view_settings",
            "edit_settings",
            "view_dashboard",
            "view_statistics",
            "view_users",
            "view_posts",
            "view_projects",
            "view_news",
            "view_transactions",
            "view_locations",
          ],
        });
        await newPermissions.save();
        console.log(`✅ Created permissions for admin ${admin.username}`);
        fixedCount++;
      } else if (!permissions.permissions.includes("manage_prices")) {
        permissions.permissions.push("manage_prices");
        await permissions.save();
        console.log(`✅ Added manage_prices to admin ${admin.username}`);
        fixedCount++;
      } else {
        console.log(`ℹ️  Admin ${admin.username} already has manage_prices`);
      }
    }

    console.log(`\n🎉 Fixed ${fixedCount} admin accounts`);
  } catch (error) {
    console.error("❌ Error fixing permissions:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await debugPriceManagementPermissions();

    // Ask user if they want to fix permissions
    console.log(
      "🔧 Do you want to auto-fix admin permissions? (This will add manage_prices to all admins)"
    );
    console.log("📝 Uncomment the line below to auto-fix:\n");

    // Uncomment this line to auto-fix:
    // await fixPriceManagementPermissions();
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

export { debugPriceManagementPermissions, fixPriceManagementPermissions };
