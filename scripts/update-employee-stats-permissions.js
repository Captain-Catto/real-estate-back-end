#!/usr/bin/env node

/**
 * Script để cập nhật quyền view_statistics cho tất cả employee
 */

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import UserPermission from "../src/models/UserPermission.js";
import { User } from "../src/models/User.js";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function updateEmployeeStatsPermissions() {
  try {
    console.log(
      "🔄 Starting permission update for employee statistics access...\n"
    );

    // Tìm tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`📊 Found ${employees.length} employees\n`);

    let updatedCount = 0;
    let alreadyHadPermission = 0;

    for (const employee of employees) {
      console.log(`👤 Processing ${employee.name} (${employee.email})`);

      // Tìm hoặc tạo UserPermission record
      let userPermission = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!userPermission) {
        // Tạo mới với quyền cơ bản cho employee
        userPermission = new UserPermission({
          userId: employee._id,
          permissions: [
            "view_users",
            "view_posts",
            "view_projects",
            "view_news",
            "view_transactions",
            "view_statistics", // Thêm quyền xem thống kê
            "view_settings",
            "view_locations",
          ],
        });
        await userPermission.save();
        console.log(`   ✅ Created new permissions with view_statistics`);
        updatedCount++;
      } else {
        // Kiểm tra xem đã có quyền view_statistics chưa
        if (!userPermission.permissions.includes("view_statistics")) {
          userPermission.permissions.push("view_statistics");
          await userPermission.save();
          console.log(`   ✅ Added view_statistics permission`);
          updatedCount++;
        } else {
          console.log(`   ℹ️  Already has view_statistics permission`);
          alreadyHadPermission++;
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Updated: ${updatedCount} employees`);
    console.log(`   Already had permission: ${alreadyHadPermission} employees`);
    console.log(`   Total employees: ${employees.length}`);

    if (updatedCount > 0) {
      console.log(
        `\n🎉 Successfully updated permissions! Employees can now access statistics page.`
      );
    } else {
      console.log(
        `\n✅ All employees already have statistics viewing permission.`
      );
    }
  } catch (error) {
    console.error("❌ Error updating permissions:", error);
    throw error;
  }
}

async function verifyPermissions() {
  try {
    console.log("\n🔍 Verifying permissions...\n");

    const employees = await User.find({ role: "employee" });

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      if (permissions) {
        const hasStatsView =
          permissions.permissions.includes("view_statistics");
        console.log(
          `👤 ${employee.name}: ${hasStatsView ? "✅" : "❌"} view_statistics`
        );
      } else {
        console.log(`👤 ${employee.name}: ❌ No permissions found`);
      }
    }
  } catch (error) {
    console.error("❌ Error verifying permissions:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await updateEmployeeStatsPermissions();
    await verifyPermissions();
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateEmployeeStatsPermissions };
