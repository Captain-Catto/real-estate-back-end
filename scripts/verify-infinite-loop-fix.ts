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

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function verifyInfiniteLoopFix() {
  try {
    await connectDB();

    console.log("🔍 Verifying Infinite Loop Fix Implementation...\n");

    // 1. Check tất cả employees không có view_statistics
    const employees = await User.find({ role: "employee", status: "active" });
    console.log(
      `👥 Checking ${employees.length} employees for view_statistics permission:`
    );

    let employeesWithoutStats = 0;
    for (const employee of employees) {
      const permissionRecord = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasViewStats =
        permissionRecord?.permissions.includes("view_statistics") || false;

      if (!hasViewStats) {
        employeesWithoutStats++;
      }

      console.log(
        `   ${employee.email}: ${
          hasViewStats ? "❌ HAS ACCESS" : "✅ NO ACCESS"
        }`
      );
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Total employees: ${employees.length}`);
    console.log(
      `   - Employees WITHOUT view_statistics: ${employeesWithoutStats}`
    );
    console.log(
      `   - Ready for infinite loop testing: ${
        employeesWithoutStats === employees.length ? "✅ YES" : "❌ NO"
      }`
    );

    // 2. Check file fix đã được apply
    const fs = require("fs");

    console.log(`\n🔧 Checking admin page fixes:`);

    // Check unauthorized page exists
    const unauthorizedPagePath = path.join(
      __dirname,
      "../../real-estate-front-end/src/app/admin/unauthorized/page.tsx"
    );
    const unauthorizedExists = fs.existsSync(unauthorizedPagePath);
    console.log(
      `   /admin/unauthorized page: ${
        unauthorizedExists ? "✅ EXISTS" : "❌ MISSING"
      }`
    );

    // Check statistics page has correct redirect
    const statsPagePath = path.join(
      __dirname,
      "../../real-estate-front-end/src/app/admin/thong-ke/page.tsx"
    );
    if (fs.existsSync(statsPagePath)) {
      const statsContent = fs.readFileSync(statsPagePath, "utf8");
      const hasCorrectRedirect = statsContent.includes(
        'redirectTo="/admin/unauthorized"'
      );
      console.log(
        `   Statistics page redirect: ${
          hasCorrectRedirect ? "✅ FIXED" : "❌ NOT FIXED"
        }`
      );
    } else {
      console.log(`   Statistics page: ❌ NOT FOUND`);
    }

    console.log(`\n🎯 Test Instructions:`);
    console.log(
      `   1. Login as any employee (employee1@gmail.com to employee10@gmail.com)`
    );
    console.log(`   2. Password: R123456`);
    console.log(`   3. Navigate to: http://localhost:3000/admin/thong-ke`);
    console.log(
      `   4. Expected: Redirect to /admin/unauthorized (NOT infinite loop)`
    );
    console.log(
      `   5. Should see: "Bạn không có quyền truy cập trang này" message`
    );

    console.log(`\n✅ Infinite Loop Fix Status: READY FOR TESTING`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

verifyInfiniteLoopFix();
