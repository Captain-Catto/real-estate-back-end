#!/usr/bin/env node

/**
 * Script để test API permissions sau khi tách dashboard và statistics
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

async function testAPIPermissions() {
  try {
    console.log("🧪 Testing API Permission Updates\n");

    // Test employee có quyền dashboard
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    console.log("📊 Dashboard API Access Test (view_dashboard required):");
    console.log("=".repeat(60));
    console.log("APIs that should be accessible with view_dashboard:");
    console.log("  - GET /api/admin/stats");
    console.log("  - GET /api/admin/recent-activities");
    console.log("  - GET /api/admin/top-posts");
    console.log();

    console.log("📈 Statistics API Access Test (view_statistics required):");
    console.log("=".repeat(60));
    console.log("APIs that require view_statistics permission:");
    console.log("  - GET /api/admin/stats/overview");
    console.log("  - GET /api/admin/stats/revenue-chart");
    console.log("  - GET /api/admin/stats/posts-chart");
    console.log("  - GET /api/admin/stats/property-types-chart");
    console.log("  - GET /api/admin/stats/top-locations");
    console.log("  - GET /api/admin/stats/user-chart");
    console.log("  - GET /api/admin/stats/page-views");
    console.log();

    // Kiểm tra permissions của từng employee
    console.log("👤 Employee Permission Analysis:");
    console.log("=".repeat(60));

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      const hasDashboard =
        permissions?.permissions.includes("view_dashboard") || false;
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      console.log(`${employee.username}:`);
      console.log(
        `  🏠 Dashboard APIs: ${hasDashboard ? "✅ CAN ACCESS" : "❌ BLOCKED"}`
      );
      console.log(
        `  📊 Statistics APIs: ${
          hasStatistics ? "✅ CAN ACCESS" : "❌ BLOCKED"
        }`
      );

      if (hasDashboard && !hasStatistics) {
        console.log(
          `  💡 Perfect! Can access basic dashboard, blocked from detailed stats`
        );
      } else if (hasDashboard && hasStatistics) {
        console.log(`  💡 Full access to both dashboard and statistics`);
      } else if (!hasDashboard) {
        console.log(
          `  ⚠️  Cannot access dashboard - needs view_dashboard permission!`
        );
      }
      console.log();
    }

    console.log("🎯 Expected Behavior:");
    console.log("1. Employee với view_dashboard → Có thể xem trang /admin");
    console.log(
      "2. Employee với view_statistics → Có thể xem trang /admin/thong-ke"
    );
    console.log(
      "3. Employee không có view_statistics → Bị chặn truy cập /admin/thong-ke"
    );
    console.log("4. API calls từ frontend sẽ fail nếu không có quyền phù hợp");
  } catch (error) {
    console.error("❌ Error testing API permissions:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testAPIPermissions();
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

export { testAPIPermissions };
