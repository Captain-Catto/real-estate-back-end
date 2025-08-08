#!/usr/bin/env node

/**
 * Script để debug infinite loop issue với employee truy cập category management
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

async function debugInfiniteLoop() {
  try {
    console.log("🔍 Debugging Infinite Loop Issue...\n");

    // Kiểm tra employee1 status
    const employee1 = await User.findOne({ email: "employee1@gmail.com" });
    if (!employee1) {
      console.log("❌ employee1 not found");
      return;
    }

    console.log(`👤 Found employee1: ${employee1.email}`);
    console.log(`   - Role: ${employee1.role}`);
    console.log(`   - ID: ${employee1._id}`);

    // Kiểm tra permissions của employee1
    const permissions = await UserPermission.findOne({
      userId: employee1._id,
    });

    console.log("\n🔐 Employee1 Permissions:");
    if (permissions && permissions.permissions) {
      console.log(`   - Total permissions: ${permissions.permissions.length}`);
      console.log(
        `   - Permissions list: ${permissions.permissions.join(", ")}`
      );

      const hasManageCategories =
        permissions.permissions.includes("manage_categories");
      console.log(
        `   - Has manage_categories: ${hasManageCategories ? "✅" : "❌"}`
      );

      if (hasManageCategories) {
        console.log(
          "   🎉 Employee1 should be able to access category management!"
        );
      } else {
        console.log("   ⚠️  Employee1 missing manage_categories permission");
      }
    } else {
      console.log("   ❌ No permissions found for employee1");
    }

    // Kiểm tra tất cả employees có manage_categories
    console.log("\n📊 All Employees with manage_categories:");
    const allEmployees = await User.find({ role: "employee" });
    let employeesWithAccess = 0;

    for (const emp of allEmployees) {
      const empPermissions = await UserPermission.findOne({ userId: emp._id });
      const hasAccess =
        empPermissions?.permissions.includes("manage_categories") || false;

      console.log(`   - ${emp.email}: ${hasAccess ? "✅" : "❌"}`);
      if (hasAccess) employeesWithAccess++;
    }

    console.log(
      `\n📈 Summary: ${employeesWithAccess}/${allEmployees.length} employees can access category management`
    );

    // Debug thông tin về auth flow
    console.log("\n🔍 Expected Auth Flow:");
    console.log("   1. User loads page → useAuth initializes");
    console.log("   2. useAuth fetches user profile → user data available");
    console.log("   3. useSidebar sees user → fetches sidebar config");
    console.log("   4. usePermissions sees user → fetches user permissions");
    console.log("   5. ProtectionGuard sees all initialized → checks access");
    console.log("   6. If has manage_categories permission → allow access");

    console.log("\n⚠️  Potential Issues:");
    console.log(
      "   - useSidebar setting permissionsLoading=true when user=null"
    );
    console.log("   - Multiple hooks managing permissions loading state");
    console.log(
      "   - Race condition between auth initialization and permission loading"
    );
    console.log("   - useEffect dependencies causing re-renders");

    console.log("\n🔧 Fixes Applied:");
    console.log(
      "   - useSidebar now sets permissionsLoading=false when no user"
    );
    console.log("   - This should prevent infinite waiting for initialization");
  } catch (error) {
    console.error("❌ Error debugging infinite loop:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await debugInfiniteLoop();

    console.log("\n✅ Debug Complete!");
    console.log("\n🎯 Next Steps:");
    console.log("   1. Test employee1 login again");
    console.log("   2. Try accessing /admin/quan-ly-danh-muc");
    console.log("   3. Check browser console for initialization logs");
    console.log("   4. Verify no more infinite ProtectionGuard loops");
  } catch (error) {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();
