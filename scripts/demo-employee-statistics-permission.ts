#!/usr/bin/env node

/**
 * Script demo việc admin cấp quyền view_statistics cho employee thông qua employee-permissions page
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

async function demoGrantStatisticsPermission() {
  try {
    console.log("🎭 Demo: Admin Granting Statistics Permission to Employee\n");

    // Tìm employee không có quyền view_statistics
    const employees = await User.find({ role: "employee" });

    let targetEmployee: any = null;
    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      if (!hasStatistics) {
        targetEmployee = employee;
        break;
      }
    }

    if (!targetEmployee) {
      console.log("ℹ️  All employees already have statistics permission");
      console.log("🔄 Removing statistics from employee2 for demo...");

      const employee2 = await User.findOne({ username: "employee2" });
      if (employee2) {
        const permissions = await UserPermission.findOne({
          userId: employee2._id,
        });
        if (permissions) {
          permissions.permissions = permissions.permissions.filter(
            (p) => p !== "view_statistics"
          );
          await permissions.save();
          targetEmployee = employee2;
          console.log("✅ Removed statistics permission from employee2");
        }
      }
    }

    if (!targetEmployee) {
      console.log("❌ No suitable employee found for demo");
      return;
    }

    console.log(`🎯 Target Employee: ${targetEmployee.username}`);

    // Check permissions before
    let permissions = await UserPermission.findOne({
      userId: targetEmployee._id,
    });

    const beforeDashboard =
      permissions?.permissions.includes("view_dashboard") || false;
    const beforeStatistics =
      permissions?.permissions.includes("view_statistics") || false;

    console.log("\n📊 Before Admin Action:");
    console.log(`   Dashboard Access: ${beforeDashboard ? "✅" : "❌"}`);
    console.log(`   Statistics Access: ${beforeStatistics ? "✅" : "❌"}`);

    // Simulate admin granting statistics permission
    console.log("\n🔄 Admin Action: Granting view_statistics permission...");

    if (permissions) {
      // Add view_statistics if not already present
      if (!permissions.permissions.includes("view_statistics")) {
        permissions.permissions.push("view_statistics");
        await permissions.save();
        console.log("✅ Added view_statistics permission");
      }
    }

    // Check permissions after
    permissions = await UserPermission.findOne({
      userId: targetEmployee._id,
    });

    const afterDashboard =
      permissions?.permissions.includes("view_dashboard") || false;
    const afterStatistics =
      permissions?.permissions.includes("view_statistics") || false;

    console.log("\n📊 After Admin Action:");
    console.log(`   Dashboard Access: ${afterDashboard ? "✅" : "❌"}`);
    console.log(`   Statistics Access: ${afterStatistics ? "✅" : "❌"}`);

    console.log("\n🎉 Results:");
    if (afterDashboard && afterStatistics) {
      console.log("✅ Employee now has FULL ACCESS:");
      console.log("   - Can access /admin (dashboard)");
      console.log("   - Can access /admin/thong-ke (statistics)");
    } else if (afterDashboard && !afterStatistics) {
      console.log("⚠️  Employee has LIMITED ACCESS:");
      console.log("   - Can access /admin (dashboard)");
      console.log("   - Cannot access /admin/thong-ke (statistics)");
    } else {
      console.log("❌ Employee has NO ACCESS to admin area");
    }

    console.log("\n🔗 UI Flow:");
    console.log("1. Admin goes to /admin/employee-permissions");
    console.log(`2. Selects employee: ${targetEmployee.username}`);
    console.log("3. Toggles 'view_statistics' permission");
    console.log("4. Saves changes");
    console.log("5. Employee can now access statistics page");
  } catch (error) {
    console.error("❌ Error in demo:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await demoGrantStatisticsPermission();
  } catch (error) {
    console.error("❌ Demo failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { demoGrantStatisticsPermission };
