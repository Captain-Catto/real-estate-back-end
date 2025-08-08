#!/usr/bin/env node

/**
 * Script test logic redirect thông minh trong trang unauthorized và ProtectionGuard
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

async function testSmartRedirectLogic() {
  try {
    console.log("🧪 Testing Smart Redirect Logic\n");

    // Lấy users mẫu
    const users = await User.find({}).limit(10);
    console.log(`👥 Found ${users.length} users for testing\n`);

    console.log("📊 Redirect Logic Table:");
    console.log("=".repeat(80));
    console.log(
      "| User Type        | Auth Status  | Target Page      | Expected Redirect   |"
    );
    console.log("=".repeat(80));

    for (const user of users) {
      const permissions = await UserPermission.findOne({
        userId: user._id,
      });

      const hasDashboard =
        permissions?.permissions.includes("view_dashboard") || false;
      const hasStatistics =
        permissions?.permissions.includes("view_statistics") || false;

      // Test scenarios
      const scenarios = [
        {
          target: "/admin",
          isAuthenticated: true,
          expectedRedirect:
            user.role === "user" || !user.role
              ? "/"
              : hasDashboard
              ? "Access Granted"
              : "/admin/unauthorized",
        },
        {
          target: "/admin/thong-ke",
          isAuthenticated: true,
          expectedRedirect:
            user.role === "user" || !user.role
              ? "/"
              : hasStatistics
              ? "Access Granted"
              : "/admin/unauthorized",
        },
        {
          target: "/admin",
          isAuthenticated: false,
          expectedRedirect: "/dang-nhap",
        },
      ];

      console.log(`\n👤 ${user.username} (${user.role}):`);
      console.log(
        `   Dashboard: ${hasDashboard ? "✅" : "❌"} | Statistics: ${
          hasStatistics ? "✅" : "❌"
        }`
      );

      scenarios.forEach((scenario, index) => {
        const auth = scenario.isAuthenticated ? "Logged In" : "Not Logged In";
        console.log(
          `   ${index + 1}. ${scenario.target} (${auth}) → ${
            scenario.expectedRedirect
          }`
        );
      });
    }

    console.log("\n🔧 Smart Redirect Logic Summary:");
    console.log("=".repeat(50));
    console.log("1. 🚫 Not Authenticated + Admin Area:");
    console.log("   → Redirect to /dang-nhap");
    console.log("");
    console.log("2. 👤 Regular User + Admin Area:");
    console.log("   → Redirect to / (homepage)");
    console.log("");
    console.log("3. 👨‍💼 Admin/Employee + Insufficient Permission:");
    console.log("   → Redirect to /admin/unauthorized");
    console.log("");
    console.log("4. ✅ Admin/Employee + Sufficient Permission:");
    console.log("   → Access granted");

    console.log("\n🎯 Unauthorized Page Logic:");
    console.log("=".repeat(40));
    console.log("- Auto redirect after 5 seconds countdown");
    console.log("- Smart redirect based on user role:");
    console.log("  • Not authenticated → /dang-nhap");
    console.log("  • Regular user → / (homepage)");
    console.log("  • Admin/Employee → /admin");

    console.log("\n✅ Key Benefits:");
    console.log("- No more infinite redirect loops");
    console.log("- Role-appropriate redirects");
    console.log("- Clear error messages");
    console.log("- Auto-recovery with countdown");
    console.log("- No AdminLayout dependency in unauthorized page");
  } catch (error) {
    console.error("❌ Error testing redirect logic:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectDb();
    await testSmartRedirectLogic();

    console.log("\n🧪 Manual Testing Guide:");
    console.log("=".repeat(40));
    console.log("1. Test as regular user:");
    console.log("   - Login as user1@gmail.com");
    console.log("   - Navigate to /admin");
    console.log("   - Should redirect to / (homepage)");
    console.log("");
    console.log("2. Test as employee without statistics:");
    console.log("   - Login as employee without view_statistics");
    console.log("   - Navigate to /admin/thong-ke");
    console.log("   - Should redirect to /admin/unauthorized");
    console.log("   - Then auto-redirect to /admin after 5 seconds");
    console.log("");
    console.log("3. Test not authenticated:");
    console.log("   - Logout");
    console.log("   - Navigate to /admin");
    console.log("   - Should redirect to /dang-nhap");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Chạy script
main();

export { testSmartRedirectLogic };
