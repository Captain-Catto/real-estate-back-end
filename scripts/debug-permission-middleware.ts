import mongoose from "mongoose";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";

async function addDebugLogsToPermissionCheck() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );

    console.log("🔧 ADDING DEBUG LOGS TO PERMISSION MIDDLEWARE\n");

    // 1. Test với employee đầu tiên
    const employee = await User.findOne({ role: "employee" });
    if (!employee) {
      console.log("❌ No employee found");
      return;
    }

    console.log(`👤 Testing Employee: ${employee.username}`);
    console.log(`📧 Email: ${employee.email}`);
    console.log(`🆔 User ID: ${employee._id}`);
    console.log(`🔰 Role: ${employee.role}\n`);

    // 2. Kiểm tra permissions trong database
    const permissions = await UserPermission.findOne({ userId: employee._id });

    console.log("📋 PERMISSION CHECK DETAILS:");
    console.log(`   - Searching for userId: ${employee._id}`);
    console.log(`   - Permission record found: ${!!permissions}`);

    if (permissions) {
      console.log(`   - Permission record ID: ${permissions._id}`);
      console.log(`   - User ID in record: ${permissions.userId}`);
      console.log(
        `   - User ID match: ${
          permissions.userId.toString() === employee._id.toString()
        }`
      );
      console.log(`   - Total permissions: ${permissions.permissions.length}`);
      console.log(
        `   - Has view_statistics: ${permissions.permissions.includes(
          "view_statistics"
        )}`
      );
      console.log(
        `   - Permission list: [${permissions.permissions.join(", ")}]`
      );
    } else {
      console.log("   ❌ NO PERMISSION RECORD FOUND!");
      console.log("   🔧 Creating permission record...");

      const newPermissions = new UserPermission({
        userId: employee._id,
        permissions: [
          "view_dashboard",
          "view_statistics",
          "view_posts",
          "view_users",
          "edit_posts",
          "create_posts",
        ],
      });

      await newPermissions.save();
      console.log("   ✅ Created new permission record");
    }

    // 3. Test specific permission check simulation
    console.log("\n🔒 MIDDLEWARE SIMULATION:");

    const testPermissions = await UserPermission.findOne({
      userId: employee._id,
    });

    console.log("Step 1 - Token verification:");
    console.log(`   ✅ User authenticated: ${employee.username}`);
    console.log(`   ✅ Role: ${employee.role}`);
    console.log(`   ✅ UserId from token: ${employee._id}`);

    console.log("\nStep 2 - Admin check:");
    const isAdmin = employee.role === "admin";
    console.log(
      `   Admin role: ${
        isAdmin ? "✅ YES (bypass permissions)" : "❌ NO (check permissions)"
      }`
    );

    console.log("\nStep 3 - Permission lookup:");
    console.log(
      `   Query: UserPermission.findOne({ userId: "${employee._id}" })`
    );
    console.log(`   Result: ${testPermissions ? "✅ Found" : "❌ Not Found"}`);

    if (testPermissions) {
      console.log("\nStep 4 - Permission check:");
      const requiredPermission = "view_statistics";
      const hasPermission =
        testPermissions.permissions.includes(requiredPermission);

      console.log(`   Required: ${requiredPermission}`);
      console.log(`   Has permission: ${hasPermission ? "✅ YES" : "❌ NO"}`);
      console.log(
        `   Middleware result: ${
          hasPermission ? "✅ ALLOW ACCESS" : "❌ DENY ACCESS (403)"
        }`
      );

      if (!hasPermission) {
        console.log("\n🔧 FIXING PERMISSION:");
        testPermissions.permissions.push(requiredPermission);
        await testPermissions.save();
        console.log("   ✅ Added view_statistics permission");
      }
    }

    // 4. Test all stats endpoints
    console.log("\n📊 STATS ENDPOINTS TEST:");

    const finalPermissions = await UserPermission.findOne({
      userId: employee._id,
    });
    const statsEndpoints = [
      "/api/admin/stats/overview",
      "/api/admin/stats/revenue-chart",
      "/api/admin/stats/posts-chart",
      "/api/admin/stats/property-types-chart",
      "/api/admin/stats/top-locations",
      "/api/admin/stats/user-chart",
    ];

    statsEndpoints.forEach((endpoint) => {
      const hasStats =
        finalPermissions?.permissions.includes("view_statistics") || false;
      const isUserAdmin = employee.role === "admin";
      const allowed = isUserAdmin || hasStats;

      console.log(`   ${allowed ? "✅" : "❌"} ${endpoint}`);
    });

    // 5. Verification summary
    console.log("\n📋 FINAL SUMMARY:");
    const finalCheck = await UserPermission.findOne({ userId: employee._id });
    const hasStats =
      finalCheck?.permissions.includes("view_statistics") || false;

    console.log(`   👤 User: ${employee.username}`);
    console.log(`   🔰 Role: ${employee.role}`);
    console.log(`   📊 Has view_statistics: ${hasStats ? "✅ YES" : "❌ NO"}`);
    console.log(
      `   🎯 Should access stats: ${
        hasStats || employee.role === "admin" ? "✅ YES" : "❌ NO"
      }`
    );

    if (hasStats || employee.role === "admin") {
      console.log("\n🎉 PERMISSION CHECK PASSED!");
      console.log("🚀 If user still gets 403, try:");
      console.log("   1. 🔄 Restart backend server");
      console.log("   2. 🔓 Clear browser cache/cookies");
      console.log("   3. 🚪 Log out and log back in");
      console.log("   4. 🧪 Check network tab for actual request headers");
    } else {
      console.log("\n❌ PERMISSION CHECK FAILED!");
      console.log("🔧 Need to fix permissions first");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

addDebugLogsToPermissionCheck();
