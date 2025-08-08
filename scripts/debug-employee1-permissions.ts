#!/usr/bin/env node

import mongoose from "mongoose";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

async function debugEmployee1Permissions() {
  try {
    console.log("✅ Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/real-estate");
    console.log("✅ Connected to MongoDB successfully");

    console.log("\n🔍 DEBUGGING EMPLOYEE1 PERMISSIONS");

    // 1. Tìm employee1
    const employee1 = await User.findOne({ email: "employee1@gmail.com" });
    if (!employee1) {
      console.log("❌ Employee1 not found");
      return;
    }

    console.log(`\n👤 Employee1 Details:`);
    console.log(`   ID: ${employee1._id}`);
    console.log(`   Username: ${employee1.username}`);
    console.log(`   Email: ${employee1.email}`);
    console.log(`   Role: ${employee1.role}`);

    // 2. Kiểm tra UserPermission record
    const userPermission = await UserPermission.findOne({
      userId: employee1._id,
    });

    if (!userPermission) {
      console.log("\n❌ No UserPermission record found for employee1");
      return;
    }

    console.log(`\n📋 UserPermission Record:`);
    console.log(`   User ID: ${userPermission.userId}`);
    console.log(
      `   Permissions Array: ${JSON.stringify(
        userPermission.permissions,
        null,
        2
      )}`
    );
    console.log(`   Created At: ${userPermission.createdAt}`);
    console.log(`   Updated At: ${userPermission.updatedAt}`);

    // 3. Kiểm tra các quyền cụ thể
    console.log(`\n🔍 Permission Checks:`);
    const hasManageCategories =
      userPermission.permissions.includes("manage_categories");
    const hasManageNewsCategories = userPermission.permissions.includes(
      "manage_news_categories"
    );

    console.log(
      `   ✅ manage_categories: ${hasManageCategories ? "YES" : "NO"}`
    );
    console.log(
      `   📰 manage_news_categories: ${hasManageNewsCategories ? "YES" : "NO"}`
    );

    // 4. Kiểm tra tất cả permissions có trong array
    console.log(`\n📝 All Permissions in Array:`);
    userPermission.permissions.forEach((permission, index) => {
      console.log(`   ${index + 1}. "${permission}"`);
    });

    // 5. Test API call simulation
    console.log(`\n🌐 API Response Simulation:`);
    const apiResponse = {
      success: true,
      data: {
        permissions: userPermission.permissions,
      },
    };
    console.log(
      `   Frontend would receive: ${JSON.stringify(apiResponse, null, 2)}`
    );

    // 6. Permission check results
    console.log(`\n✅ FRONTEND PERMISSION CHECK RESULTS:`);
    console.log(
      `   can(PERMISSIONS.SETTINGS.MANAGE_CATEGORIES): ${hasManageCategories}`
    );
    console.log(
      `   can(PERMISSIONS.NEWS.MANAGE_CATEGORIES): ${hasManageNewsCategories}`
    );
    console.log(
      `   Should have access to page: ${
        hasManageCategories || hasManageNewsCategories
      }`
    );

    if (hasManageCategories || hasManageNewsCategories) {
      console.log(
        `\n🎉 CONCLUSION: Employee1 should have access to category management page!`
      );

      if (hasManageCategories && hasManageNewsCategories) {
        console.log(
          `   💡 Should see both tabs: "Danh mục BĐS" and "Danh mục tin tức"`
        );
      } else if (hasManageCategories) {
        console.log(`   💡 Should see only: "Danh mục BĐS" tab`);
      } else if (hasManageNewsCategories) {
        console.log(`   💡 Should see only: "Danh mục tin tức" tab`);
      }
    } else {
      console.log(
        `\n❌ CONCLUSION: Employee1 should NOT have access to category management page!`
      );
    }

    console.log("\n🔧 TROUBLESHOOTING TIPS:");
    console.log("1. Clear browser cache and cookies");
    console.log(
      "2. Check if permissions are being fetched correctly in browser DevTools"
    );
    console.log("3. Check if usePermissions hook is working correctly");
    console.log(
      "4. Verify that PERMISSIONS.SETTINGS.MANAGE_CATEGORIES = 'manage_categories'"
    );
    console.log(
      "5. Verify that PERMISSIONS.NEWS.MANAGE_CATEGORIES = 'manage_news_categories'"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    console.log("\n📝 Closing MongoDB connection...");
    await mongoose.connection.close();
    console.log("📝 MongoDB connection closed");
  }
}

// Run the debug
debugEmployee1Permissions().catch(console.error);
