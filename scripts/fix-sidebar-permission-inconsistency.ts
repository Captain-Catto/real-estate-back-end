#!/usr/bin/env node

/**
 * Script để sửa inconsistency giữa quyền page và sidebar menu
 *
 * VẤN ĐỀ:
 * - Trang /admin sử dụng quyền "view_dashboard"
 * - Menu "stats" trong sidebar sử dụng quyền "view_statistics"
 *
 * KẾT QUẢ:
 * - Employee có view_dashboard nhưng không có view_statistics
 * - Vào được trang /admin nhưng không thấy menu thống kê
 *
 * GIẢI PHÁP:
 * - Thống nhất quyền: dashboard menu sử dụng view_dashboard
 * - Chỉ trang /admin/thong-ke mới cần view_statistics
 */

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import SidebarConfig from "../src/models/SidebarConfig";

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  }
}

async function fixSidebarPermissionInconsistency() {
  try {
    console.log("🔧 Fixing sidebar permission inconsistency...\n");

    // Tìm sidebar config
    let sidebarConfig = await SidebarConfig.findOne({ isDefault: true });

    if (!sidebarConfig) {
      console.log("❌ Không tìm thấy sidebar config mặc định!");
      return;
    }

    console.log(`📋 Found sidebar config: ${sidebarConfig.name}`);
    console.log(`📊 Total menu items: ${sidebarConfig.items.length}\n`);

    // Tìm và cập nhật menu items
    let updatedCount = 0;
    const updatedItems = sidebarConfig.items.map((item: any) => {
      const itemObj =
        typeof item.toObject === "function" ? item.toObject() : { ...item };

      // Kiểm tra và sửa menu "dashboard"
      if (itemObj.id === "dashboard") {
        if (!itemObj.metadata) itemObj.metadata = {};

        const oldPermissions = itemObj.metadata.permissions || [];
        const needsViewDashboard = !oldPermissions.includes("view_dashboard");

        if (needsViewDashboard) {
          itemObj.metadata.permissions = ["view_dashboard"];
          console.log(
            `✅ Dashboard menu: Updated permissions to ["view_dashboard"]`
          );
          updatedCount++;
        } else {
          console.log(`ℹ️  Dashboard menu: Already has correct permissions`);
        }
      }

      // Kiểm tra menu "stats" - chỉ cần view_statistics cho trang thống kê
      if (itemObj.id === "stats") {
        if (!itemObj.metadata) itemObj.metadata = {};

        const oldPermissions = itemObj.metadata.permissions || [];
        console.log(
          `📊 Stats menu current permissions: [${oldPermissions.join(", ")}]`
        );

        // Giữ nguyên view_statistics cho menu stats vì đây là menu dẫn đến trang thống kê
        if (!oldPermissions.includes("view_statistics")) {
          itemObj.metadata.permissions = ["view_statistics"];
          console.log(`✅ Stats menu: Ensured view_statistics permission`);
          updatedCount++;
        } else {
          console.log(`ℹ️  Stats menu: Already has view_statistics permission`);
        }
      }

      return itemObj;
    });

    if (updatedCount > 0) {
      sidebarConfig.items = updatedItems;
      await sidebarConfig.save();
      console.log(`\n💾 Saved ${updatedCount} permission updates to database`);
    } else {
      console.log(`\nℹ️  No updates needed - permissions are already correct`);
    }

    // Hiển thị cấu hình hiện tại
    console.log(`\n📋 CURRENT SIDEBAR PERMISSION MAPPING:`);
    updatedItems.forEach((item: any) => {
      if (item.id === "dashboard" || item.id === "stats") {
        const permissions = item.metadata?.permissions || [];
        console.log(`   ${item.id.padEnd(12)} → [${permissions.join(", ")}]`);
      }
    });

    console.log(`\n🎯 EXPECTED BEHAVIOR:`);
    console.log(
      `   📈 Employee với view_dashboard   → Thấy menu Dashboard + truy cập /admin`
    );
    console.log(
      `   📊 Employee với view_statistics  → Thấy menu Stats + truy cập /admin/thong-ke`
    );
    console.log(
      `   🚫 Employee không có permissions → Không thấy menu tương ứng`
    );
  } catch (error) {
    console.error("❌ Error fixing sidebar permissions:", error);
    throw error;
  }
}

async function verifySidebarPermissions() {
  try {
    console.log(`\n🔍 VERIFYING SIDEBAR PERMISSIONS:`);

    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    const dashboardMenu = sidebarConfig.items.find(
      (item: any) => item.id === "dashboard"
    );
    const statsMenu = sidebarConfig.items.find(
      (item: any) => item.id === "stats"
    );

    if (dashboardMenu) {
      const perms = dashboardMenu.metadata?.permissions || [];
      console.log(`✅ Dashboard menu permissions: [${perms.join(", ")}]`);
    }

    if (statsMenu) {
      const perms = statsMenu.metadata?.permissions || [];
      console.log(`✅ Stats menu permissions: [${perms.join(", ")}]`);
    }
  } catch (error) {
    console.error("❌ Error verifying permissions:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await fixSidebarPermissionInconsistency();
    await verifySidebarPermissions();

    console.log(`\n🎉 Sidebar permission inconsistency fix completed!`);
    console.log(`\n📝 NEXT STEPS:`);
    console.log(`   1. Restart frontend application to reload sidebar`);
    console.log(
      `   2. Test employee login with only view_dashboard permission`
    );
    console.log(`   3. Verify dashboard menu shows but stats menu doesn't`);
    console.log(`   4. Grant view_statistics to test stats menu visibility`);
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(`\n✅ Disconnected from MongoDB`);
  }
}

// Chạy script
main();

export { fixSidebarPermissionInconsistency, verifySidebarPermissions };
