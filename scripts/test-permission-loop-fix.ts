import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

// Kết nối MongoDB
async function connectDB() {
  try {
    const mongoUrl = "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function testPermissionFlow() {
  try {
    console.log("🔍 Testing permission system after infinite loop fix...\n");

    // 1. Kiểm tra user và permissions có tồn tại
    const testUser = await User.findOne({ role: "employee" });
    if (!testUser) {
      console.log("❌ No employee user found");
      return;
    }

    console.log(
      `✅ Found test user: ${testUser.username} (ID: ${testUser._id})`
    );

    // 2. Kiểm tra permissions của user
    const userPermissions = await UserPermission.findOne({
      userId: testUser._id,
    });

    if (!userPermissions) {
      console.log("❌ No permissions found for user");
      return;
    }

    console.log(
      `✅ User has ${userPermissions.permissions.length} permissions:`
    );
    userPermissions.permissions.forEach((perm) => {
      console.log(`   - ${perm}`);
    });

    // 3. Kiểm tra cụ thể quyền view_statistics
    const hasViewStats =
      userPermissions.permissions.includes("view_statistics");
    console.log(
      `\n📊 view_statistics permission: ${hasViewStats ? "✅ YES" : "❌ NO"}`
    );

    // 4. Kiểm tra quyền admin (cần có để truy cập employee-permissions)
    const hasManageEmployees =
      userPermissions.permissions.includes("manage_employees");
    console.log(
      `👥 manage_employees permission: ${
        hasManageEmployees ? "✅ YES" : "❌ NO"
      }`
    );

    // 5. Tóm tắt kết quả
    console.log("\n🎯 SUMMARY:");
    console.log("==========================================");
    console.log(`User: ${testUser.username} (${testUser.role})`);
    console.log(`Total permissions: ${userPermissions.permissions.length}`);
    console.log(`Can view statistics: ${hasViewStats ? "YES" : "NO"}`);
    console.log(`Can manage employees: ${hasManageEmployees ? "YES" : "NO"}`);

    if (hasViewStats) {
      console.log("\n✅ Employee có thể truy cập trang thống kê");
    } else {
      console.log("\n❌ Employee KHÔNG thể truy cập trang thống kê");
    }

    // 6. Kiểm tra tất cả employees
    console.log("\n👥 ALL EMPLOYEES STATUS:");
    console.log("==========================================");

    const allEmployees = await User.find({ role: "employee" }).lean();

    for (const emp of allEmployees) {
      const empPermissions = await UserPermission.findOne({ userId: emp._id });
      const hasStats =
        empPermissions?.permissions.includes("view_statistics") || false;
      console.log(`${emp.username}: ${hasStats ? "✅" : "❌"} view_statistics`);
    }
  } catch (error) {
    console.error("❌ Error testing permission flow:", error);
  }
}

async function main() {
  await connectDB();
  await testPermissionFlow();

  console.log("\n🏁 Test completed. Check the results above.");
  process.exit(0);
}

// Chạy script
main().catch(console.error);
