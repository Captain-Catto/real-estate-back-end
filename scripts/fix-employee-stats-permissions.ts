#!/usr/bin/env node

/**
 * Script để force update quyền view_statistics cho tất cả employee
 * Đảm bảo tất cả employee đều có quyền xem thống kê
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

async function forceUpdateEmployeePermissions() {
  try {
    console.log(
      "🔄 Force updating ALL employee permissions to include view_statistics...\n"
    );

    // Tìm tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`📊 Found ${employees.length} employees\n`);

    let updatedCount = 0;
    let createdCount = 0;

    // Quyền cơ bản cho employee (đảm bảo có view_statistics)
    const basicEmployeePermissions = [
      "view_users",
      "view_posts",
      "view_projects",
      "view_news",
      "view_transactions",
      "view_statistics", // Quan trọng: quyền xem thống kê
      "view_settings",
      "view_locations",
      "view_contacts",
    ];

    for (const employee of employees) {
      console.log(`👤 Processing ${employee.username} (${employee.email})`);

      // Tìm UserPermission record
      let userPermission = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!userPermission) {
        // Tạo mới với quyền đầy đủ
        userPermission = new UserPermission({
          userId: employee._id,
          permissions: basicEmployeePermissions,
        });
        await userPermission.save();
        console.log(`   ✅ Created new permissions record`);
        createdCount++;
      } else {
        // Cập nhật permissions, đảm bảo có tất cả quyền cơ bản
        let needsUpdate = false;
        const currentPermissions = [...userPermission.permissions];

        for (const permission of basicEmployeePermissions) {
          if (!currentPermissions.includes(permission)) {
            currentPermissions.push(permission);
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          userPermission.permissions = currentPermissions;
          await userPermission.save();
          console.log(`   ✅ Updated permissions (added missing permissions)`);
          updatedCount++;
        } else {
          console.log(`   ✅ Already has all required permissions`);
        }
      }

      // Verify permissions ngay lập tức
      const verify = await UserPermission.findOne({ userId: employee._id });
      const hasStats = verify?.permissions.includes("view_statistics");
      console.log(`   📊 Stats permission: ${hasStats ? "✅ YES" : "❌ NO"}`);
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Created: ${createdCount} permission records`);
    console.log(`   Updated: ${updatedCount} permission records`);
    console.log(`   Total employees: ${employees.length}`);
    console.log(
      `\n🎉 All employees should now have view_statistics permission!`
    );
  } catch (error) {
    console.error("❌ Error updating permissions:", error);
    throw error;
  }
}

async function verifyAllPermissions() {
  try {
    console.log("\n🔍 Final verification of all employee permissions...\n");

    const employees = await User.find({ role: "employee" });
    let allGood = true;

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
        if (!hasStatsView) allGood = false;
      } else {
        console.log(`👤 ${employee.username}: ❌ No permissions found`);
        allGood = false;
      }
    }

    if (allGood) {
      console.log(
        `\n🎉 SUCCESS: All employees have view_statistics permission!`
      );
    } else {
      console.log(
        `\n❌ ERROR: Some employees still missing view_statistics permission!`
      );
    }
  } catch (error) {
    console.error("❌ Error verifying permissions:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await forceUpdateEmployeePermissions();
    await verifyAllPermissions();
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

export { forceUpdateEmployeePermissions };
