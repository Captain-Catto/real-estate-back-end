#!/usr/bin/env node

/**
 * Script để debug user hiện tại và permissions của họ
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

async function debugCurrentUserPermissions() {
  try {
    console.log("🔍 DEBUGGING CURRENT USER ACCESS TO PRICE MANAGEMENT\n");

    // Check employees specifically (they shouldn't have access)
    console.log("👥 CHECKING EMPLOYEE ACCOUNTS:\n");

    const employees = await User.find({ role: "employee" });

    for (const employee of employees) {
      console.log(`👤 Employee: ${employee.username} (${employee.email})`);

      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!permissions) {
        console.log(`   ❌ No permission record`);
        console.log(
          `   🎯 Result: Would see countdown page (no permissions at all)\n`
        );
        continue;
      }

      const userPermissions = permissions.permissions || [];
      const hasManagePrices = userPermissions.includes("manage_prices");
      const hasViewDashboard = userPermissions.includes("view_dashboard");

      console.log(`   📊 Total permissions: ${userPermissions.length}`);
      console.log(
        `   🔑 manage_prices: ${hasManagePrices ? "✅ YES" : "❌ NO"}`
      );
      console.log(
        `   🔑 view_dashboard: ${hasViewDashboard ? "✅ YES" : "❌ NO"}`
      );

      if (!hasManagePrices) {
        console.log(
          `   🎯 Result: Would see countdown page (insufficient permissions)`
        );
      } else {
        console.log(`   🎯 Result: Should have access to price management`);
      }

      console.log("");
    }

    // Specific recommendations
    console.log("💡 ANALYSIS:\n");

    console.log("1. If you're seeing countdown page:");
    console.log("   - You might be logged in as an employee");
    console.log("   - Employees don't have manage_prices permission");
    console.log("   - This is expected behavior\n");

    console.log("2. To access price management:");
    console.log("   - Login as admin (adminnn@gmail.com)");
    console.log("   - Or grant manage_prices to specific employees\n");

    console.log("3. To test different scenarios:");
    console.log("   - Grant permission: Add 'manage_prices' to employee");
    console.log("   - Revoke permission: Remove 'manage_prices' from user");
    console.log("   - Switch accounts: Logout and login as different user\n");

    // Show which users can access
    console.log("✅ USERS WHO CAN ACCESS PRICE MANAGEMENT:\n");

    const usersWithAccess = await UserPermission.find({
      permissions: { $in: ["manage_prices"] },
    });

    for (const userPerm of usersWithAccess) {
      const user = await User.findById(userPerm.userId);
      if (user) {
        console.log(
          `   ✅ ${user.role.toUpperCase()}: ${user.username} (${user.email})`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error debugging:", error);
  }
}

async function grantPricePermissionToEmployee() {
  try {
    console.log("\n🔧 GRANTING PRICE PERMISSION TO EMPLOYEE (FOR TESTING)\n");

    // Find first employee
    const employee = await User.findOne({ role: "employee" });
    if (!employee) {
      console.log("❌ No employee found");
      return;
    }

    console.log(`👤 Target employee: ${employee.username} (${employee.email})`);

    let permissions = await UserPermission.findOne({ userId: employee._id });

    if (!permissions) {
      permissions = new UserPermission({
        userId: employee._id,
        permissions: ["view_dashboard", "manage_prices"],
      });
      await permissions.save();
      console.log("✅ Created new permission record with manage_prices");
    } else if (!permissions.permissions.includes("manage_prices")) {
      permissions.permissions.push("manage_prices");
      await permissions.save();
      console.log("✅ Added manage_prices to existing permissions");
    } else {
      console.log("ℹ️  Employee already has manage_prices permission");
    }

    console.log(
      "\n🎯 Now this employee should be able to access price management without countdown!"
    );
  } catch (error) {
    console.error("❌ Error granting permission:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await debugCurrentUserPermissions();

    console.log(
      "🔧 Want to grant price permission to an employee for testing?"
    );
    console.log("📝 Uncomment the line below:\n");

    // Uncomment to grant permission to employee for testing:
    // await grantPricePermissionToEmployee();
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

export { debugCurrentUserPermissions, grantPricePermissionToEmployee };
