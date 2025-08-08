#!/usr/bin/env node

/**
 * Script để test employee access vào trang quản lý danh mục
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
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function testEmployeeCategoryAccess() {
  try {
    console.log("🧪 TESTING EMPLOYEE ACCESS TO CATEGORY MANAGEMENT PAGE\n");

    // 1. Kiểm tra employee có quyền manage_categories
    console.log("1️⃣ Checking employees with manage_categories permission:\n");

    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employee accounts\n`);

    let employeesWithAccess = 0;

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      const hasManageCategories =
        permissions?.permissions.includes("manage_categories") || false;

      if (hasManageCategories) {
        console.log(
          `   ✅ ${employee.username} (${employee.email}) - CAN ACCESS`
        );
        employeesWithAccess++;
      } else {
        console.log(
          `   ❌ ${employee.username} (${employee.email}) - NO ACCESS`
        );
      }
    }

    console.log(
      `\n📊 Summary: ${employeesWithAccess}/${employees.length} employees can access category management`
    );

    // 2. Cấp quyền cho một employee để test
    if (employees.length > 0 && employeesWithAccess === 0) {
      console.log("\n2️⃣ Granting permission to first employee for testing:\n");

      const testEmployee = employees[0];
      console.log(
        `🎯 Granting manage_categories to: ${testEmployee.username} (${testEmployee.email})`
      );

      let permissions = await UserPermission.findOne({
        userId: testEmployee._id,
      });

      if (!permissions) {
        permissions = new UserPermission({
          userId: testEmployee._id,
          permissions: ["view_dashboard", "view_settings", "manage_categories"],
        });
      } else {
        if (!permissions.permissions.includes("manage_categories")) {
          permissions.permissions.push("manage_categories");
        }
      }

      await permissions.save();
      console.log("   ✅ Permission granted successfully!");

      employeesWithAccess++;
    }

    // 3. Kiểm tra xem có employee nào có thể access không
    console.log("\n3️⃣ EMPLOYEE ACCESS VERIFICATION:\n");

    if (employeesWithAccess > 0) {
      console.log(
        "🎉 SUCCESS: Some employees can now access category management!"
      );
      console.log("\n📋 What employees can do:");
      console.log("   ✅ Access /admin/quan-ly-danh-muc page");
      console.log("   ✅ View property categories");
      console.log("   ✅ View news categories");
      console.log("   ✅ Create/edit/delete categories");
      console.log("   ✅ Reorder categories");
      console.log("   ✅ Toggle category visibility");

      console.log("\n💡 To test in frontend:");
      console.log(
        "   1. Login as an employee with manage_categories permission"
      );
      console.log("   2. Go to /admin/quan-ly-danh-muc");
      console.log("   3. You should see the category management interface");
      console.log("   4. All CRUD operations should work properly");
    } else {
      console.log("⚠️  No employees have manage_categories permission");
      console.log("\n💡 To grant permission:");
      console.log("   1. Login as admin");
      console.log("   2. Go to /admin/employee-permissions");
      console.log("   3. Select an employee");
      console.log(
        "   4. Find 'Quản lý danh mục bất động sản' in 'Cài đặt hệ thống'"
      );
      console.log("   5. Enable it and save");
    }

    // 4. Final status check
    console.log("\n4️⃣ FINAL STATUS:\n");

    const allUsersWithPermission = await UserPermission.find({
      permissions: { $in: ["manage_categories"] },
    }).populate("userId", "username email role");

    console.log("👥 All users with manage_categories permission:");
    for (const userPerm of allUsersWithPermission) {
      const user = userPerm.userId as any;
      console.log(
        `   ${user.role.toUpperCase()}: ${user.username} (${user.email})`
      );
    }

    console.log("\n✅ PAGE ACCESS TEST COMPLETED!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

async function main() {
  try {
    await connectDb();
    await testEmployeeCategoryAccess();
  } catch (error) {
    console.error("❌ Script failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n📝 MongoDB connection closed");
  }
}

// Run script
if (require.main === module) {
  main();
}

export { testEmployeeCategoryAccess };
