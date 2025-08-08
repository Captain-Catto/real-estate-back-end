#!/usr/bin/env node

/**
 * Script để test phân biệt quyền view_dashboard và view_statistics
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

async function testDashboardVsStatistics() {
  try {
    console.log("🧪 Testing Dashboard vs Statistics Permission Separation\n");

    // Lấy tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    let dashboardOnlyCount = 0;
    let bothPermissionsCount = 0;
    let noAccessCount = 0;

    console.log("📊 Permission Analysis:");
    console.log("=".repeat(60));

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      const hasDashboard =
        permissions?.permissions.includes("view_dashboard") || false;
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      let status = "";
      let emoji = "";

      if (hasDashboard && hasStatistics) {
        status = "Full Access (Dashboard + Statistics)";
        emoji = "🟢";
        bothPermissionsCount++;
      } else if (hasDashboard && !hasStatistics) {
        status = "Dashboard Only (Perfect!)";
        emoji = "🔵";
        dashboardOnlyCount++;
      } else if (!hasDashboard && hasStatistics) {
        status = "Statistics Only (Need Dashboard!)";
        emoji = "🟡";
      } else {
        status = "No Access (Need Dashboard!)";
        emoji = "🔴";
        noAccessCount++;
      }

      console.log(`${emoji} ${employee.username.padEnd(12)} | ${status}`);
      console.log(
        `   Dashboard: ${hasDashboard ? "✅" : "❌"} | Statistics: ${
          hasStatistics ? "✅" : "❌"
        }`
      );
      console.log();
    }

    console.log("📈 Summary:");
    console.log("=".repeat(40));
    console.log(`🔵 Dashboard Only: ${dashboardOnlyCount} employees`);
    console.log(`🟢 Both Permissions: ${bothPermissionsCount} employees`);
    console.log(`🔴 No Dashboard Access: ${noAccessCount} employees`);
    console.log();

    // Recommendations
    console.log("💡 Recommendations:");
    if (dashboardOnlyCount > 0) {
      console.log(
        `✅ ${dashboardOnlyCount} employees have perfect setup (dashboard only)`
      );
    }
    if (bothPermissionsCount > 0) {
      console.log(
        `ℹ️  ${bothPermissionsCount} employees have full access (can view statistics)`
      );
    }
    if (noAccessCount > 0) {
      console.log(
        `⚠️  ${noAccessCount} employees need view_dashboard permission!`
      );
    }

    console.log("\n🎯 Expected Flow:");
    console.log("1. All employees should have 'view_dashboard' (basic access)");
    console.log("2. Admin can grant 'view_statistics' separately if needed");
    console.log("3. This allows fine-grained control over statistics access");

    return { dashboardOnlyCount, bothPermissionsCount, noAccessCount };
  } catch (error) {
    console.error("❌ Error testing permissions:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testDashboardVsStatistics();
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

export { testDashboardVsStatistics };
