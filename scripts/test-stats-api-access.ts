import mongoose from "mongoose";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";

async function testStatsAPIEndpoints() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );

    console.log("🧪 TESTING STATS API ENDPOINTS\n");

    // 1. Tìm employee để test
    const employee = await User.findOne({ role: "employee" });
    if (!employee) {
      console.log("❌ No employee found");
      return;
    }

    console.log(`👤 Testing with employee: ${employee.username}\n`);

    // 2. Kiểm tra và cập nhật permissions
    let permissions = await UserPermission.findOne({ userId: employee._id });

    if (!permissions) {
      console.log("🔧 Creating permissions for employee...");
      permissions = new UserPermission({
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
      await permissions.save();
      console.log("✅ Created permissions record");
    } else {
      console.log(
        `📋 Current permissions: [${permissions.permissions.join(", ")}]`
      );

      // Đảm bảo có view_statistics
      if (!permissions.permissions.includes("view_statistics")) {
        permissions.permissions.push("view_statistics");
        await permissions.save();
        console.log("✅ Added view_statistics permission");
      }
    }

    // 3. Simulate middleware checks for different endpoints
    console.log("\n🔒 SIMULATING MIDDLEWARE CHECKS:\n");

    const endpoints = [
      { path: "/api/admin/stats/overview", permission: "view_statistics" },
      { path: "/api/admin/stats/revenue-chart", permission: "view_statistics" },
      { path: "/api/admin/stats/posts-chart", permission: "view_statistics" },
      {
        path: "/api/admin/stats/property-types-chart",
        permission: "view_statistics",
      },
      { path: "/api/admin/stats/top-locations", permission: "view_statistics" },
      { path: "/api/admin/stats/user-chart", permission: "view_statistics" },
    ];

    endpoints.forEach((endpoint) => {
      const hasPermission = permissions!.permissions.includes(
        endpoint.permission
      );
      const isAdmin = employee.role === "admin";
      const accessGranted = isAdmin || hasPermission;

      console.log(`${accessGranted ? "✅" : "❌"} ${endpoint.path}`);
      console.log(`   Required: ${endpoint.permission}`);
      console.log(`   User has permission: ${hasPermission}`);
      console.log(`   Access: ${accessGranted ? "GRANTED" : "DENIED"}`);
      console.log("");
    });

    // 4. Check authentication flow
    console.log("🔐 AUTHENTICATION FLOW CHECK:\n");

    console.log("1. User authentication:");
    console.log(`   ✅ User exists: ${employee.username}`);
    console.log(`   ✅ Role: ${employee.role}`);
    console.log(`   ✅ User ID: ${employee._id}`);

    console.log("\n2. Permission loading:");
    console.log(`   ✅ Permissions record exists: ${!!permissions}`);
    console.log(
      `   ✅ Permissions count: ${permissions?.permissions.length || 0}`
    );
    console.log(
      `   ✅ Has view_statistics: ${
        permissions?.permissions.includes("view_statistics") || false
      }`
    );

    console.log("\n3. Middleware simulation:");
    const requiredPerm = "view_statistics";
    const hasRequiredPerm =
      permissions?.permissions.includes(requiredPerm) || false;
    const isUserAdmin = employee.role === "admin";

    console.log(`   Required permission: ${requiredPerm}`);
    console.log(`   Is admin: ${isUserAdmin}`);
    console.log(`   Has permission: ${hasRequiredPerm}`);
    console.log(
      `   Final result: ${
        isUserAdmin || hasRequiredPerm
          ? "✅ ACCESS GRANTED"
          : "❌ ACCESS DENIED"
      }`
    );

    if (!isUserAdmin && !hasRequiredPerm) {
      console.log(
        "\n❌ ISSUE FOUND: Employee doesn't have required permission!"
      );
      console.log("🔧 Fixing...");

      permissions!.permissions.push(requiredPerm);
      await permissions!.save();
      console.log("✅ Added view_statistics permission");
    }

    // 5. Debug token/session issues
    console.log("\n🎫 TOKEN/SESSION DEBUG:\n");
    console.log("If employee still can't access after permission fix:");
    console.log("1. 🔄 Clear browser cache and cookies");
    console.log("2. 🚪 Log out completely and log back in");
    console.log("3. 🔄 Restart backend server to clear any cached middleware");
    console.log("4. 🧪 Test with new browser session/incognito mode");

    // 6. Final verification
    console.log("\n✅ FINAL VERIFICATION:\n");
    const finalPermissions = await UserPermission.findOne({
      userId: employee._id,
    });
    const hasStats =
      finalPermissions?.permissions.includes("view_statistics") || false;

    console.log(`Employee: ${employee.username}`);
    console.log(`Has view_statistics: ${hasStats ? "✅ YES" : "❌ NO"}`);
    console.log(`Should access stats: ${hasStats ? "✅ YES" : "❌ NO"}`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

testStatsAPIEndpoints();
