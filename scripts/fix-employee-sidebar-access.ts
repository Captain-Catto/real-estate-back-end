#!/usr/bin/env node

/**
 * Script để fix quyền truy cập sidebar cho employee khi admin tạo nhóm mới
 *
 * VẤN ĐỀ:
 * - Admin tạo nhóm mới với allowedRoles: ["admin"]
 * - Employee không thấy nhóm dù đã có quyền permissions
 * - Sidebar cache không refresh automatic
 *
 * GIẢI PHÁP:
 * - Update allowedRoles cho tất cả items
 * - Đảm bảo permission mapping đúng
 * - Force refresh sidebar cache
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

async function fixEmployeeSidebarAccess() {
  try {
    console.log("🔧 FIXING EMPLOYEE ACCESS TO SIDEBAR ITEMS\n");

    // Find sidebar config
    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    console.log(`📋 Found sidebar config: ${sidebarConfig.name}`);
    console.log(`📊 Total items: ${sidebarConfig.items.length}\n`);

    let updatedCount = 0;
    const updatedItems = sidebarConfig.items.map((item: any) => {
      const itemObj =
        typeof item.toObject === "function" ? item.toObject() : { ...item };

      // Rules for allowedRoles
      const isAdminOnlyItem =
        item.id.includes("employee-management") || // Employee management
        item.id.includes("sidebar-config") || // Sidebar config
        item.metadata?.permissions?.includes("edit_settings"); // Settings editing

      const shouldIncludeEmployee = !isAdminOnlyItem;

      // Current roles
      const currentRoles = itemObj.allowedRoles || ["admin"];
      const hasEmployeeRole = currentRoles.includes("employee");

      if (shouldIncludeEmployee && !hasEmployeeRole) {
        itemObj.allowedRoles = [...currentRoles, "employee"];
        console.log(
          `✅ Added employee access to: ${itemObj.title} (${itemObj.id})`
        );
        updatedCount++;
      } else if (isAdminOnlyItem && hasEmployeeRole) {
        itemObj.allowedRoles = ["admin"];
        console.log(
          `🔒 Restricted to admin only: ${itemObj.title} (${itemObj.id})`
        );
        updatedCount++;
      } else {
        console.log(`ℹ️  No change needed: ${itemObj.title}`);
      }

      // Ensure metadata.permissions exists
      if (!itemObj.metadata) {
        itemObj.metadata = {};
      }
      if (!itemObj.metadata.permissions) {
        itemObj.metadata.permissions = [];
      }

      return itemObj;
    });

    if (updatedCount > 0) {
      sidebarConfig.items = updatedItems;
      await sidebarConfig.save();
      console.log(`\n💾 Updated ${updatedCount} items in database`);
    } else {
      console.log(`\nℹ️  No updates needed - all items have correct access`);
    }

    // Show summary
    console.log(`\n📊 ACCESS SUMMARY:`);

    const adminOnlyItems = updatedItems.filter(
      (item: any) =>
        item.allowedRoles.length === 1 && item.allowedRoles[0] === "admin"
    );

    const sharedItems = updatedItems.filter(
      (item: any) =>
        item.allowedRoles.includes("admin") &&
        item.allowedRoles.includes("employee")
    );

    console.log(`   🔒 Admin only: ${adminOnlyItems.length} items`);
    console.log(`   🤝 Shared (admin + employee): ${sharedItems.length} items`);

    console.log(`\n📋 ADMIN ONLY ITEMS:`);
    adminOnlyItems.forEach((item: any) => {
      console.log(`   - ${item.title} (${item.id})`);
    });

    console.log(`\n📋 SHARED ITEMS (Employee can see):`);
    sharedItems.forEach((item: any) => {
      console.log(`   - ${item.title} (${item.id})`);
    });
  } catch (error) {
    console.error("❌ Error fixing sidebar access:", error);
    throw error;
  }
}

async function verifyEmployeeAccess() {
  try {
    console.log(`\n🔍 VERIFYING EMPLOYEE ACCESS:\n`);

    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) return;

    const employeeAccessibleItems = sidebarConfig.items.filter((item: any) =>
      item.allowedRoles.includes("employee")
    );

    console.log(
      `✅ Employee can access ${employeeAccessibleItems.length} items:`
    );
    employeeAccessibleItems.forEach((item: any) => {
      const permissions = item.metadata?.permissions || [];
      console.log(
        `   📌 ${item.title} → permissions: [${permissions.join(", ")}]`
      );
    });

    console.log(`\n💡 TO TEST:`);
    console.log(`   1. Login as employee`);
    console.log(`   2. Check sidebar shows all accessible items`);
    console.log(`   3. Create new group as admin`);
    console.log(`   4. Verify employee sees new group immediately`);
  } catch (error) {
    console.error("❌ Error verifying access:", error);
  }
}

async function createTestGroup() {
  try {
    console.log(`\n🧪 CREATING TEST GROUP FOR EMPLOYEE VISIBILITY:\n`);

    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    // Create test group
    const testGroup = {
      id: `test_group_${Date.now()}`,
      title: "Nhóm Test Employee",
      path: "/admin/test-group",
      parentId: undefined, // ✅ Fixed: undefined instead of null
      order: 999,
      isVisible: true,
      allowedRoles: ["admin", "employee"], // ✅ Both roles
      metadata: {
        isGroup: true,
        permissions: [], // No specific permissions needed
      },
    };

    sidebarConfig.items.push(testGroup);
    await sidebarConfig.save();

    console.log(`✅ Created test group: "${testGroup.title}"`);
    console.log(`📋 ID: ${testGroup.id}`);
    console.log(`🤝 Allowed roles: [${testGroup.allowedRoles.join(", ")}]`);
    console.log(
      `🔑 Permissions: [${testGroup.metadata.permissions.join(", ")}]`
    );

    console.log(
      `\n🎯 This group should be visible to both admin and employee!`
    );
  } catch (error) {
    console.error("❌ Error creating test group:", error);
  }
}

async function main() {
  try {
    await connectDb();

    const args = process.argv.slice(2);
    const action = args[0];

    if (action === "test") {
      await createTestGroup();
    } else if (action === "verify") {
      await verifyEmployeeAccess();
    } else {
      await fixEmployeeSidebarAccess();
      await verifyEmployeeAccess();
    }

    console.log(`\n🎉 Employee sidebar access fix completed!`);
    console.log(`\n📝 USAGE:`);
    console.log(`   Fix access:     npx tsx fix-employee-sidebar-access.ts`);
    console.log(
      `   Verify access:  npx tsx fix-employee-sidebar-access.ts verify`
    );
    console.log(
      `   Create test:    npx tsx fix-employee-sidebar-access.ts test`
    );
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

export { fixEmployeeSidebarAccess, verifyEmployeeAccess, createTestGroup };
