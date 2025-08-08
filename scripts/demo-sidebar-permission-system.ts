#!/usr/bin/env node

/**
 * Script demo cách sidebar permission system hoạt động với menu mới được tạo
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

async function demonstrateSidebarPermissionSystem() {
  try {
    console.log("🎭 SIDEBAR PERMISSION SYSTEM DEMONSTRATION\n");

    // 1. Tạo menu mới (giống như admin tạo qua UI)
    console.log("1️⃣ CREATING NEW MENU GROUP (simulating admin action):\n");

    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    // Thêm nhóm mới
    const newGroupId = `demo_group_${Date.now()}`;
    const newGroup = {
      id: newGroupId,
      title: "Demo Nhóm Mới",
      path: "/admin/demo-group",
      parentId: undefined, // undefined instead of null
      order: sidebarConfig.items.length + 1,
      isVisible: true,
      allowedRoles: ["admin"], // 🔐 Chỉ admin - không include employee
      metadata: {
        isGroup: true,
        permissions: ["demo_permission"], // Cần permission này để employee thấy
      },
    };

    sidebarConfig.items.push(newGroup);
    await sidebarConfig.save();

    console.log(`✅ Created new group: "${newGroup.title}"`);
    console.log(`   allowedRoles: [${newGroup.allowedRoles.join(", ")}]`);
    console.log(
      `   required permissions: [${newGroup.metadata.permissions.join(", ")}]`
    );

    // 2. Kiểm tra ai có thể thấy menu này
    console.log("\n2️⃣ CHECKING WHO CAN SEE THIS MENU:\n");

    // Check admins
    const admins = await User.find({ role: "admin" }).limit(2);
    for (const admin of admins) {
      console.log(`👑 Admin: ${admin.username}`);
      console.log(`   Role check: ✅ PASS (admin in allowedRoles)`);
      console.log(`   Permission check: ✅ SKIP (admin has all permissions)`);
      console.log(`   Result: ✅ CAN SEE MENU\n`);
    }

    // Check employees
    const employees = await User.find({ role: "employee" }).limit(3);
    for (const employee of employees) {
      console.log(`👤 Employee: ${employee.username}`);

      // Role check
      const hasRole = newGroup.allowedRoles.includes("employee");
      console.log(
        `   Role check: ${hasRole ? "✅ PASS" : "❌ FAIL"} (employee ${
          hasRole ? "in" : "not in"
        } allowedRoles)`
      );

      if (!hasRole) {
        console.log(`   Result: ❌ CANNOT SEE MENU (role not allowed)\n`);
        continue;
      }

      // Permission check
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });
      const userPermissions = permissions?.permissions || [];
      const hasPermission = newGroup.metadata.permissions.some((p) =>
        userPermissions.includes(p)
      );

      console.log(
        `   Permission check: ${hasPermission ? "✅ PASS" : "❌ FAIL"} (has ${
          hasPermission ? "required" : "no required"
        } permissions)`
      );
      console.log(
        `   User permissions: [${userPermissions.slice(0, 3).join(", ")}${
          userPermissions.length > 3 ? "..." : ""
        }]`
      );
      console.log(
        `   Required permissions: [${newGroup.metadata.permissions.join(", ")}]`
      );
      console.log(
        `   Result: ${
          hasPermission ? "✅ CAN SEE MENU" : "❌ CANNOT SEE MENU"
        }\n`
      );
    }

    // 3. Demo cấp quyền để employee thấy menu
    console.log("3️⃣ GRANTING PERMISSION TO EMPLOYEE:\n");

    const targetEmployee = employees[0];
    if (targetEmployee) {
      console.log(
        `🎯 Target: ${targetEmployee.username} (${targetEmployee.email})`
      );

      let permissions = await UserPermission.findOne({
        userId: targetEmployee._id,
      });
      if (!permissions) {
        permissions = new UserPermission({
          userId: targetEmployee._id,
          permissions: ["demo_permission"],
        });
      } else {
        if (!permissions.permissions.includes("demo_permission")) {
          permissions.permissions.push("demo_permission");
        }
      }

      await permissions.save();
      console.log(
        `   ✅ Granted "demo_permission" to ${targetEmployee.username}`
      );
      console.log(`   📋 Now employee has required permission to see the menu`);

      // Verify
      const updatedPermissions = await UserPermission.findOne({
        userId: targetEmployee._id,
      });
      const hasNewPermission =
        updatedPermissions?.permissions.includes("demo_permission");
      console.log(
        `   🔍 Verification: ${hasNewPermission ? "✅ SUCCESS" : "❌ FAILED"}`
      );
    }

    // 4. Summary
    console.log("\n4️⃣ PERMISSION SYSTEM SUMMARY:\n");
    console.log("📋 How sidebar permissions work:");
    console.log(
      "   1. allowedRoles: Controls which user roles can potentially see the menu"
    );
    console.log(
      "   2. metadata.permissions: Specific permissions required for that role"
    );
    console.log(
      "   3. Admin bypass: Admins see all menus regardless of permissions"
    );
    console.log(
      "   4. Employee filtering: Employees only see menus they have permissions for\n"
    );

    console.log("🎯 Best practices:");
    console.log(
      "   • Set allowedRoles: ['admin'] for new menus (don't include employee by default)"
    );
    console.log(
      "   • Add specific permissions in metadata.permissions for fine-grained control"
    );
    console.log("   • Grant permissions to employees only when needed");
    console.log(
      "   • Use permission management page to control employee access\n"
    );

    // Cleanup
    console.log("🧹 CLEANUP: Removing demo menu...");
    sidebarConfig.items = sidebarConfig.items.filter(
      (item) => item.id !== newGroupId
    );
    await sidebarConfig.save();
    console.log("✅ Demo menu removed");
  } catch (error) {
    console.error("❌ Error in demonstration:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await demonstrateSidebarPermissionSystem();

    console.log("\n🎉 DEMONSTRATION COMPLETED!");
    console.log("\n📝 KEY TAKEAWAYS:");
    console.log(
      "   • New menus default to admin-only (allowedRoles: ['admin'])"
    );
    console.log("   • Employees need explicit permissions to see menus");
    console.log("   • Use sidebar config UI to set permissions for each menu");
    console.log(
      "   • Use employee permission page to grant access to specific employees"
    );
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

export { demonstrateSidebarPermissionSystem };
