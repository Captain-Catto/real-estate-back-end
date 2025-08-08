#!/usr/bin/env node

/**
 * Script để cấp quyền manage_prices cho employee cụ thể
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

async function grantPricePermissionToEmployee(username: string) {
  try {
    console.log(
      `🔧 GRANTING PRICE MANAGEMENT PERMISSION TO EMPLOYEE: ${username}\n`
    );

    // Find the employee
    const employee = await User.findOne({ username, role: "employee" });
    if (!employee) {
      console.log(`❌ Employee "${username}" not found`);
      return;
    }

    console.log(`👤 Found employee: ${employee.username} (${employee.email})`);

    let permissions = await UserPermission.findOne({ userId: employee._id });

    if (!permissions) {
      permissions = new UserPermission({
        userId: employee._id,
        permissions: [
          "view_dashboard",
          "view_posts",
          "view_users",
          "manage_prices", // Add price management permission
        ],
      });
      await permissions.save();
      console.log("✅ Created new permission record with manage_prices");
    } else {
      const hasPermission = permissions.permissions.includes("manage_prices");

      if (hasPermission) {
        console.log("ℹ️  Employee already has manage_prices permission");
      } else {
        permissions.permissions.push("manage_prices");
        await permissions.save();
        console.log("✅ Added manage_prices to existing permissions");
      }
    }

    // Verify
    const updatedPermissions = await UserPermission.findOne({
      userId: employee._id,
    });
    const hasPermission =
      updatedPermissions?.permissions.includes("manage_prices");

    console.log(`\n🎯 Verification:`);
    console.log(`   Has manage_prices: ${hasPermission ? "✅ YES" : "❌ NO"}`);
    console.log(
      `   Total permissions: ${updatedPermissions?.permissions.length || 0}`
    );

    if (hasPermission) {
      console.log(
        `\n🎉 SUCCESS! ${username} can now access price management page`
      );
      console.log(
        `📝 To test: Login as ${username} and visit /admin/quan-ly-gia`
      );
    }
  } catch (error) {
    console.error("❌ Error granting permission:", error);
  }
}

async function removePricePermissionFromEmployee(username: string) {
  try {
    console.log(
      `🚫 REMOVING PRICE MANAGEMENT PERMISSION FROM EMPLOYEE: ${username}\n`
    );

    const employee = await User.findOne({ username, role: "employee" });
    if (!employee) {
      console.log(`❌ Employee "${username}" not found`);
      return;
    }

    const permissions = await UserPermission.findOne({ userId: employee._id });
    if (!permissions) {
      console.log("ℹ️  Employee has no permission record");
      return;
    }

    const hasPermission = permissions.permissions.includes("manage_prices");
    if (!hasPermission) {
      console.log("ℹ️  Employee doesn't have manage_prices permission");
      return;
    }

    permissions.permissions = permissions.permissions.filter(
      (p) => p !== "manage_prices"
    );
    await permissions.save();

    console.log("✅ Removed manage_prices permission");
    console.log(
      `🎯 ${username} will now see countdown page when accessing price management`
    );
  } catch (error) {
    console.error("❌ Error removing permission:", error);
  }
}

async function main() {
  try {
    await connectDb();

    const args = process.argv.slice(2);
    const action = args[0]; // 'grant' or 'remove'
    const username = args[1]; // employee username

    if (!action || !username) {
      console.log("📝 Usage:");
      console.log(
        "   Grant permission:  npx tsx grant-price-permission.ts grant employee1"
      );
      console.log(
        "   Remove permission: npx tsx grant-price-permission.ts remove employee1"
      );
      console.log("");
      console.log("📋 Available employees:");

      const employees = await User.find({ role: "employee" }).limit(5);
      employees.forEach((emp) => {
        console.log(`   - ${emp.username} (${emp.email})`);
      });

      return;
    }

    if (action === "grant") {
      await grantPricePermissionToEmployee(username);
    } else if (action === "remove") {
      await removePricePermissionFromEmployee(username);
    } else {
      console.log("❌ Invalid action. Use 'grant' or 'remove'");
    }
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

export { grantPricePermissionToEmployee, removePricePermissionFromEmployee };
