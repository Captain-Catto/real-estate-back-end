#!/usr/bin/env node

import mongoose from "mongoose";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";

async function testPermissionAPICall() {
  try {
    console.log("✅ Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/real-estate");
    console.log("✅ Connected to MongoDB successfully");

    // Simulate the API call that frontend makes
    const employee1 = await User.findOne({ email: "employee1@gmail.com" });
    if (!employee1) {
      console.log("❌ Employee1 not found");
      return;
    }

    console.log(
      `\n🌐 Simulating API call: GET /api/permissions/user/${employee1._id}`
    );

    // This is what PermissionController.getUserPermissions does
    const userPermission = await UserPermission.findOne({
      userId: employee1._id,
    });

    if (!userPermission) {
      console.log("❌ No permissions found");
      return;
    }

    const response = {
      success: true,
      message: "Lấy quyền người dùng thành công",
      data: {
        permissions: userPermission.permissions,
      },
    };

    console.log("📡 API Response:");
    console.log(JSON.stringify(response, null, 2));

    // Test specific permission checks
    console.log("\n🔍 Testing specific permission checks:");
    const permissions = userPermission.permissions;

    console.log(
      `✅ Has 'manage_categories': ${permissions.includes("manage_categories")}`
    );
    console.log(
      `✅ Has 'manage_news_categories': ${permissions.includes(
        "manage_news_categories"
      )}`
    );

    // Simulate frontend permission check
    const canManageCategories = permissions.includes("manage_categories");
    const canManageNewsCategories = permissions.includes(
      "manage_news_categories"
    );

    console.log("\n🎯 Frontend logic simulation:");
    console.log(
      `can(PERMISSIONS.SETTINGS.MANAGE_CATEGORIES): ${canManageCategories}`
    );
    console.log(
      `can(PERMISSIONS.NEWS.MANAGE_CATEGORIES): ${canManageNewsCategories}`
    );
    console.log(
      `Should have page access: ${
        canManageCategories || canManageNewsCategories
      }`
    );

    if (canManageCategories || canManageNewsCategories) {
      console.log(
        "\n✅ EMPLOYEE1 SHOULD HAVE ACCESS TO CATEGORY MANAGEMENT PAGE!"
      );

      console.log("\n🔧 If employee1 is still getting kicked out, check:");
      console.log(
        "1. Browser DevTools Network tab - is the API call successful?"
      );
      console.log("2. Browser DevTools Console - any JavaScript errors?");
      console.log(
        "3. usePermissions hook - is it fetching permissions correctly?"
      );
      console.log("4. PagePermissionGuard - is it working correctly?");
      console.log("5. Clear browser cache and localStorage");
      console.log("6. Try hard refresh (Ctrl+F5)");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    console.log("\n📝 Closing MongoDB connection...");
    await mongoose.connection.close();
    console.log("📝 MongoDB connection closed");
  }
}

testPermissionAPICall().catch(console.error);
