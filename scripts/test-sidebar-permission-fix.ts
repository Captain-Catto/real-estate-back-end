#!/usr/bin/env node

/**
 * Script test để verify fix sidebar permission inconsistency
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
import SidebarConfig from "../src/models/SidebarConfig";

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  }
}

async function testSidebarPermissionFix() {
  try {
    console.log("🧪 TESTING SIDEBAR PERMISSION INCONSISTENCY FIX\n");

    // 1. Kiểm tra sidebar configuration
    console.log("1️⃣ CHECKING SIDEBAR CONFIGURATION:");
    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });

    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    const dashboardMenu = sidebarConfig.items.find(
      (item: any) => item.id === "dashboard"
    );
    const statisticsMenu = sidebarConfig.items.find(
      (item: any) => item.id === "statistics"
    );

    if (dashboardMenu) {
      const perms = dashboardMenu.metadata?.permissions || [];
      console.log(
        `   📈 Dashboard menu: [${perms.join(", ")}] ${
          perms.includes("view_dashboard") ? "✅" : "❌"
        }`
      );
    }

    if (statisticsMenu) {
      const perms = statisticsMenu.metadata?.permissions || [];
      console.log(
        `   📊 Statistics menu: [${perms.join(", ")}] ${
          perms.includes("view_statistics") ? "✅" : "❌"
        }`
      );
    }

    // 2. Kiểm tra employee permissions
    console.log("\n2️⃣ CHECKING EMPLOYEE PERMISSIONS:");
    const employees = await User.find({ role: "employee" }).limit(3);

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const perms = permissions?.permissions || [];

      const hasViewDashboard = perms.includes("view_dashboard");
      const hasViewStatistics = perms.includes("view_statistics");

      console.log(`   👤 ${employee.username}:`);
      console.log(
        `      view_dashboard: ${hasViewDashboard ? "✅" : "❌"} → ${
          hasViewDashboard
            ? "Thấy menu Dashboard + vào /admin"
            : "Không vào được /admin"
        }`
      );
      console.log(
        `      view_statistics: ${hasViewStatistics ? "✅" : "❌"} → ${
          hasViewStatistics
            ? "Thấy menu Statistics + vào /admin/thong-ke"
            : "Không thấy menu Statistics"
        }`
      );
    }

    // 3. Test scenarios
    console.log("\n3️⃣ TEST SCENARIOS:");
    console.log("   🔬 Scenario 1: Employee chỉ có view_dashboard");
    console.log(
      "      ✅ Kết quả mong đợi: Thấy menu Dashboard, vào được /admin, KHÔNG thấy menu Statistics"
    );

    console.log(
      "   🔬 Scenario 2: Employee có cả view_dashboard + view_statistics"
    );
    console.log(
      "      ✅ Kết quả mong đợi: Thấy cả menu Dashboard và Statistics, vào được cả 2 trang"
    );

    console.log("   🔬 Scenario 3: Employee không có quyền nào");
    console.log(
      "      ✅ Kết quả mong đợi: Không thấy menu nào, không vào được trang admin"
    );

    console.log("\n4️⃣ PERMISSION MAPPING SUMMARY:");
    console.log(
      "   📋 Trang /admin                → Cần quyền: view_dashboard"
    );
    console.log(
      "   📋 Trang /admin/thong-ke       → Cần quyền: view_statistics"
    );
    console.log(
      "   📋 Menu Dashboard (Tổng quan)  → Cần quyền: view_dashboard"
    );
    console.log(
      "   📋 Menu Statistics (Thống kê)  → Cần quyền: view_statistics"
    );

    console.log("\n🎯 CONSISTENCY CHECK:");
    const dashboardPagePermission = "view_dashboard";
    const dashboardMenuPermission = dashboardMenu?.metadata?.permissions?.[0];
    const isConsistent = dashboardPagePermission === dashboardMenuPermission;

    console.log(`   Page /admin quyền:     ${dashboardPagePermission}`);
    console.log(`   Menu Dashboard quyền:  ${dashboardMenuPermission}`);
    console.log(
      `   Consistency:           ${isConsistent ? "✅ MATCHED" : "❌ MISMATCH"}`
    );
  } catch (error) {
    console.error("❌ Error testing:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await testSidebarPermissionFix();

    console.log("\n🎉 SIDEBAR PERMISSION FIX VERIFICATION COMPLETED!");
    console.log("\n📝 TO TEST MANUALLY:");
    console.log("   1. Login với employee account");
    console.log("   2. Kiểm tra sidebar chỉ hiển thị menu có quyền tương ứng");
    console.log("   3. Test access /admin và /admin/thong-ke");
    console.log("   4. Grant/revoke permissions và verify sidebar cập nhật");
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

export { testSidebarPermissionFix };
