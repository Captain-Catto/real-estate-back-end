#!/usr/bin/env node

/**
 * Script để thêm permission manage_categories vào hệ thống
 * Permission này sẽ được sử dụng cho trang quản lý danh mục
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
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

async function addManageCategoriesPermission() {
  try {
    console.log("🎯 ADDING MANAGE_CATEGORIES PERMISSION\n");

    // 1. Thêm permission cho tất cả admin
    console.log("1️⃣ Adding permission to admin users:\n");

    const admins = await User.find({ role: "admin" });
    let adminCount = 0;

    for (const admin of admins) {
      console.log(`👤 Processing admin: ${admin.username} (${admin.email})`);

      let permissions = await UserPermission.findOne({ userId: admin._id });

      if (!permissions) {
        // Tạo permissions mới cho admin
        permissions = new UserPermission({
          userId: admin._id,
          permissions: [
            "manage_categories",
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
        await permissions.save();
        console.log(`   ✅ Created permissions with manage_categories`);
        adminCount++;
      } else if (!permissions.permissions.includes("manage_categories")) {
        permissions.permissions.push("manage_categories");
        await permissions.save();
        console.log(`   ✅ Added manage_categories to existing permissions`);
        adminCount++;
      } else {
        console.log(`   ℹ️  Already has manage_categories permission`);
      }
    }

    console.log(`\n📊 Updated ${adminCount} admin accounts\n`);

    // 2. Kiểm tra employee có permission này không (có thể được admin cấp)
    console.log("2️⃣ Checking employee permissions:\n");

    const employees = await User.find({ role: "employee" });
    let employeeWithPermission = 0;

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (
        permissions &&
        permissions.permissions.includes("manage_categories")
      ) {
        console.log(
          `👤 Employee ${employee.username} has manage_categories permission`
        );
        employeeWithPermission++;
      }
    }

    if (employeeWithPermission === 0) {
      console.log(
        "ℹ️  No employees currently have manage_categories permission"
      );
      console.log(
        "   This is expected - admins can grant this permission if needed"
      );
    }

    // 3. Verification
    console.log("\n3️⃣ VERIFICATION:\n");

    const usersWithPermission = await UserPermission.find({
      permissions: { $in: ["manage_categories"] },
    }).populate("userId", "username email role");

    console.log("✅ Users with manage_categories permission:");
    for (const userPerm of usersWithPermission) {
      const user = userPerm.userId as any;
      console.log(
        `   ${user.role.toUpperCase()}: ${user.username} (${user.email})`
      );
    }

    console.log(
      "\n🎉 SUCCESS! manage_categories permission has been configured"
    );
    console.log("\n📋 What this enables:");
    console.log("   ✅ Access to /admin/quan-ly-danh-muc page");
    console.log("   ✅ Create, edit, delete categories");
    console.log("   ✅ Manage news categories");
    console.log("   ✅ Reorder and toggle category status");
  } catch (error) {
    console.error("❌ Error adding manage_categories permission:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await addManageCategoriesPermission();
    console.log("\n✅ Script completed successfully!");
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Chạy script
if (require.main === module) {
  main();
}

export { addManageCategoriesPermission };
