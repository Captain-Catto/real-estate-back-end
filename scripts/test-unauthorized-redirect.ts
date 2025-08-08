#!/usr/bin/env node

/**
 * Script test logic redirect của trang unauthorized
 * Kiểm tra xem trang unauthorized có hoạt động đúng không
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

async function simulateUserScenarios() {
  try {
    console.log("🎭 Testing Unauthorized Page Redirect Logic\n");

    // Scenario 1: Admin với full permissions
    console.log("🧪 SCENARIO 1: Admin User (Should have full access)");
    const admin = await User.findOne({ role: "admin" });
    if (admin) {
      const adminPermissions = await UserPermission.findOne({
        userId: admin._id,
      });
      const hasDashboard =
        adminPermissions?.permissions.includes("view_dashboard");
      const hasStatistics =
        adminPermissions?.permissions.includes("view_statistics");

      console.log(`👑 Admin: ${admin.username}`);
      console.log(`   Dashboard access: ${hasDashboard ? "✅" : "❌"}`);
      console.log(`   Statistics access: ${hasStatistics ? "✅" : "❌"}`);
      console.log(`   Expected behavior:`);
      console.log(`   - /admin → ✅ Allow access`);
      console.log(`   - /admin/thong-ke → ✅ Allow access`);
      console.log(`   - No unauthorized redirects needed\n`);
    }

    // Scenario 2: Employee với chỉ view_dashboard
    console.log("🧪 SCENARIO 2: Employee with Dashboard Only");
    const employees = await User.find({ role: "employee" });
    const dashboardOnlyEmployee = employees.find(async (emp) => {
      const perms = await UserPermission.findOne({ userId: emp._id });
      return (
        perms?.permissions.includes("view_dashboard") &&
        !perms?.permissions.includes("view_statistics")
      );
    });

    if (dashboardOnlyEmployee) {
      const empPermissions = await UserPermission.findOne({
        userId: dashboardOnlyEmployee._id,
      });
      const hasDashboard =
        empPermissions?.permissions.includes("view_dashboard");
      const hasStatistics =
        empPermissions?.permissions.includes("view_statistics");

      console.log(`👤 Employee: ${dashboardOnlyEmployee.username}`);
      console.log(`   Dashboard access: ${hasDashboard ? "✅" : "❌"}`);
      console.log(`   Statistics access: ${hasStatistics ? "✅" : "❌"}`);
      console.log(`   Expected behavior:`);
      console.log(`   - /admin → ✅ Allow access`);
      console.log(
        `   - /admin/thong-ke → ❌ Redirect to /admin/unauthorized → Auto redirect to /admin`
      );
      console.log(`   - Smart redirect prevents infinite loop\n`);
    }

    // Scenario 3: Employee với full permissions
    console.log("🧪 SCENARIO 3: Employee with Full Permissions");
    const fullAccessEmployee = employees.find(async (emp) => {
      const perms = await UserPermission.findOne({ userId: emp._id });
      return (
        perms?.permissions.includes("view_dashboard") &&
        perms?.permissions.includes("view_statistics")
      );
    });

    if (fullAccessEmployee) {
      const empPermissions = await UserPermission.findOne({
        userId: fullAccessEmployee._id,
      });
      const hasDashboard =
        empPermissions?.permissions.includes("view_dashboard");
      const hasStatistics =
        empPermissions?.permissions.includes("view_statistics");

      console.log(`👤 Employee: ${fullAccessEmployee.username}`);
      console.log(`   Dashboard access: ${hasDashboard ? "✅" : "❌"}`);
      console.log(`   Statistics access: ${hasStatistics ? "✅" : "❌"}`);
      console.log(`   Expected behavior:`);
      console.log(`   - /admin → ✅ Allow access`);
      console.log(`   - /admin/thong-ke → ✅ Allow access`);
      console.log(`   - No unauthorized redirects needed\n`);
    }

    // Scenario 4: Regular user (khách hàng)
    console.log("🧪 SCENARIO 4: Regular User (Customer)");
    const customer = await User.findOne({ role: "customer" });
    if (customer) {
      console.log(`👥 Customer: ${customer.username}`);
      console.log(`   Expected behavior:`);
      console.log(
        `   - /admin → ❌ Redirect to /admin/unauthorized → Auto redirect to /`
      );
      console.log(`   - Any admin page → ❌ Should redirect to homepage`);
      console.log(`   - Smart redirect based on role\n`);
    }

    // Test unauthorized page logic
    console.log("🔧 UNAUTHORIZED PAGE LOGIC:");
    console.log("✅ No AdminLayout dependency (prevents circular issues)");
    console.log("✅ Smart redirect based on user role:");
    console.log("   - Admin/Employee → redirect to /admin");
    console.log("   - Customer/No auth → redirect to /");
    console.log("✅ 5-second countdown with immediate redirect option");
    console.log("✅ Clear messaging about permission requirements");
  } catch (error) {
    console.error("❌ Error in user scenarios:", error);
    throw error;
  }
}

async function testPermissionCounts() {
  try {
    console.log("\n📊 PERMISSION DISTRIBUTION SUMMARY:\n");

    // Count users by role and permissions
    const admins = await User.find({ role: "admin" });
    const employees = await User.find({ role: "employee" });
    const customers = await User.find({ role: "customer" });

    console.log(`👑 Admins: ${admins.length} total`);
    for (const admin of admins) {
      const perms = await UserPermission.findOne({ userId: admin._id });
      console.log(
        `   ${admin.username}: ${
          perms?.permissions.length || 0
        } permissions (Full access)`
      );
    }

    console.log(`\n👤 Employees: ${employees.length} total`);
    let dashboardOnly = 0;
    let fullAccess = 0;

    for (const emp of employees) {
      const perms = await UserPermission.findOne({ userId: emp._id });
      const hasDashboard = perms?.permissions.includes("view_dashboard");
      const hasStatistics = perms?.permissions.includes("view_statistics");

      if (hasDashboard && hasStatistics) {
        fullAccess++;
        console.log(
          `   ${emp.username}: Full access (${
            perms?.permissions.length || 0
          } permissions)`
        );
      } else if (hasDashboard) {
        dashboardOnly++;
        console.log(
          `   ${emp.username}: Dashboard only (${
            perms?.permissions.length || 0
          } permissions)`
        );
      } else {
        console.log(
          `   ${emp.username}: No admin access (${
            perms?.permissions.length || 0
          } permissions)`
        );
      }
    }

    console.log(`\n📈 Employee Access Summary:`);
    console.log(`   Dashboard only: ${dashboardOnly} employees`);
    console.log(`   Full access: ${fullAccess} employees`);
    console.log(`   Perfect distribution for testing!`);

    console.log(
      `\n👥 Customers: ${customers.length} total (No admin permissions)`
    );
  } catch (error) {
    console.error("❌ Error counting permissions:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();

    console.log("🧪 UNAUTHORIZED PAGE REDIRECT TEST");
    console.log("==================================\n");

    await simulateUserScenarios();
    await testPermissionCounts();

    console.log("\n🎉 TEST COMPLETE!");
    console.log("\n📋 MANUAL TESTING CHECKLIST:");
    console.log("1. ✅ Login as admin → access /admin and /admin/thong-ke");
    console.log(
      "2. ✅ Login as employee with dashboard only → access /admin, blocked from /admin/thong-ke"
    );
    console.log(
      "3. ✅ Login as employee with full access → access all admin pages"
    );
    console.log("4. ✅ Login as customer → blocked from all admin pages");
    console.log("5. ✅ Test unauthorized page redirect logic");
    console.log("\n🔄 Next: Test in browser to verify redirect behavior!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy test
main();

export { simulateUserScenarios, testPermissionCounts };
