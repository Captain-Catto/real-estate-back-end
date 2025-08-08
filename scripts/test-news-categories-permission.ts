#!/usr/bin/env node

import mongoose from "mongoose";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

async function testNewsCategoriesPermission() {
  try {
    console.log("✅ Connecting to MongoDB...");
    await mongoose.connect("mongodb://localhost:27017/real-estate");
    console.log("✅ Connected to MongoDB successfully");

    console.log("\n🧪 TESTING NEWS CATEGORIES PERMISSION");

    // 1. Tìm employee1 để thêm quyền manage_news_categories
    const employee1 = await User.findOne({ email: "employee1@gmail.com" });
    if (!employee1) {
      console.log("❌ Employee1 not found");
      return;
    }

    console.log(
      `\n1️⃣ Adding manage_news_categories permission to employee1...`
    );

    // Kiểm tra xem đã có UserPermission record chưa
    let userPermission = await UserPermission.findOne({
      userId: employee1._id,
    });

    if (!userPermission) {
      // Tạo UserPermission record mới với cả hai quyền
      userPermission = new UserPermission({
        userId: employee1._id,
        permissions: ["manage_categories", "manage_news_categories"],
      });
      await userPermission.save();
      console.log("✅ UserPermission record created with both permissions");
    } else {
      // Cập nhật permissions array
      if (!userPermission.permissions.includes("manage_news_categories")) {
        userPermission.permissions.push("manage_news_categories");
        await userPermission.save();
        console.log(
          "✅ Permission manage_news_categories added to existing record"
        );
      } else {
        console.log("✅ Permission manage_news_categories already exists");
      }
    }

    // 2. Kiểm tra quyền của các employee
    console.log("\n2️⃣ Checking employee permissions:");

    const employees = await User.find({ role: "employee" }).limit(5);

    for (const employee of employees) {
      const userPermission = await UserPermission.findOne({
        userId: employee._id,
      });

      const hasManageCategories =
        userPermission?.permissions.includes("manage_categories") || false;
      const hasManageNews =
        userPermission?.permissions.includes("manage_news_categories") || false;

      console.log(`\n👤 ${employee.username} (${employee.email}):`);
      console.log(
        `   📝 manage_categories: ${hasManageCategories ? "✅ YES" : "❌ NO"}`
      );
      console.log(
        `   📰 manage_news_categories: ${hasManageNews ? "✅ YES" : "❌ NO"}`
      );
    }

    // 3. Test case scenarios
    console.log("\n3️⃣ TEST SCENARIOS:");
    console.log("📋 Expected access patterns:");

    // employee1: có cả hai quyền -> có thể vào cả hai tab
    const emp1 = await User.findOne({ email: "employee1@gmail.com" });
    if (emp1) {
      const emp1UserPermission = await UserPermission.findOne({
        userId: emp1._id,
      });

      const hasManageCategories =
        emp1UserPermission?.permissions.includes("manage_categories") || false;
      const hasManageNews =
        emp1UserPermission?.permissions.includes("manage_news_categories") ||
        false;

      console.log(`\n🧪 Employee1 access:`);
      console.log(
        `   Property Tab: ${
          hasManageCategories ? "✅ CAN ACCESS" : "❌ DENIED"
        }`
      );
      console.log(
        `   News Tab: ${hasManageNews ? "✅ CAN ACCESS" : "❌ DENIED"}`
      );
    }

    console.log("\n💡 Frontend Testing Instructions:");
    console.log("1. Login as employee1@gmail.com -> Should see both tabs now");
    console.log("2. Login as admin -> Should see both tabs");
    console.log("3. Test creating categories in both tabs");

    console.log("\n✅ NEWS CATEGORIES PERMISSION TEST COMPLETED!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    console.log("📝 Closing MongoDB connection...");
    await mongoose.connection.close();
    console.log("📝 MongoDB connection closed");
  }
}

// Run the test
testNewsCategoriesPermission().catch(console.error);
