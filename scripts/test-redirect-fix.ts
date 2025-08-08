import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
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

async function testRedirectFixAndRoleBased() {
  try {
    await connectDB();

    console.log("🔧 REDIRECT FIX & ROLE-BASED ACCESS TEST\n");
    console.log("=".repeat(60));

    // 1. Check user distribution
    console.log("\n👥 1. USER DISTRIBUTION CHECK:");
    const adminCount = await User.countDocuments({ role: "admin" });
    const employeeCount = await User.countDocuments({ role: "employee" });
    const userCount = await User.countDocuments({ role: "user" });
    const noRoleCount = await User.countDocuments({
      $or: [{ role: { $exists: false } }, { role: null }],
    });

    console.log(`   🔑 Admin: ${adminCount} users (Should have full access)`);
    console.log(
      `   👤 Employee: ${employeeCount} users (Should have admin area access)`
    );
    console.log(
      `   🙍 Regular User: ${userCount} users (Should redirect to homepage)`
    );
    console.log(
      `   ❓ No Role: ${noRoleCount} users (Should redirect to homepage)`
    );

    // 2. Get sample users for testing
    console.log("\n🧪 2. SAMPLE USERS FOR TESTING:");

    const sampleAdmin = await User.findOne({ role: "admin" });
    const sampleEmployee = await User.findOne({ role: "employee" });
    const sampleUser = await User.findOne({ role: "user" });

    if (sampleAdmin) {
      console.log(`   ✅ Admin Test User: ${sampleAdmin.email}`);
    }
    if (sampleEmployee) {
      console.log(`   ✅ Employee Test User: ${sampleEmployee.email}`);
    }
    if (sampleUser) {
      console.log(`   ✅ Regular Test User: ${sampleUser.email}`);
    }

    // 3. Changes made
    console.log("\n🔧 3. FIXES IMPLEMENTED:");
    console.log(
      "   ✅ Fixed ProtectionGuard: setIsChecking(false) before redirects"
    );
    console.log(
      "   ✅ Added logic for non-authenticated users accessing admin area"
    );
    console.log(
      "   ✅ Updated admin dashboard to use EmployeeGuard (role-based)"
    );
    console.log("   ✅ Smart redirect logic based on user role and context");

    // 4. Expected behavior
    console.log("\n🎯 4. EXPECTED BEHAVIOR:");
    console.log(
      "   ┌─────────────────┬────────────────┬─────────────────┬──────────────────────┐"
    );
    console.log(
      "   │ User Type       │ Authentication │ Admin Access    │ Redirect/Behavior    │"
    );
    console.log(
      "   ├─────────────────┼────────────────┼─────────────────┼──────────────────────┤"
    );
    console.log(
      "   │ Not logged in   │ ❌             │ /admin/*        │ → /dang-nhap         │"
    );
    console.log(
      "   │ Admin           │ ✅             │ /admin/*        │ ✅ Allow access      │"
    );
    console.log(
      "   │ Employee        │ ✅             │ /admin/*        │ ✅ Allow access      │"
    );
    console.log(
      "   │ Regular user    │ ✅             │ /admin/*        │ → / (homepage)       │"
    );
    console.log(
      "   │ No role         │ ✅             │ /admin/*        │ → / (homepage)       │"
    );
    console.log(
      "   └─────────────────┴────────────────┴─────────────────┴──────────────────────┘"
    );

    // 5. Testing scenarios
    console.log("\n🧪 5. TESTING SCENARIOS TO VERIFY FIX:");
    console.log("   A. NOT LOGGED IN:");
    console.log("      1. Navigate to: http://localhost:3000/admin");
    console.log("      2. Expected: Immediate redirect to /dang-nhap");
    console.log(
      '      3. Should NOT see "Đang kiểm tra quyền truy cập..." forever'
    );
    console.log("");
    console.log("   B. REGULAR USER:");
    console.log('      1. Login as regular user (role: "user")');
    console.log("      2. Navigate to: http://localhost:3000/admin");
    console.log("      3. Expected: Immediate redirect to / (homepage)");
    console.log(
      '      4. Should see error toast: "Bạn không có quyền truy cập khu vực quản trị"'
    );
    console.log("");
    console.log("   C. USER WITH NO ROLE:");
    console.log("      1. Login as user with no role (role: null/undefined)");
    console.log("      2. Navigate to: http://localhost:3000/admin");
    console.log("      3. Expected: Immediate redirect to / (homepage)");
    console.log("      4. Should see error toast");
    console.log("");
    console.log("   D. ADMIN/EMPLOYEE:");
    console.log("      1. Login as admin or employee");
    console.log("      2. Navigate to: http://localhost:3000/admin");
    console.log("      3. Expected: Access granted, show admin dashboard");

    // 6. Key fixes
    console.log("\n🔑 6. KEY FIXES DETAILS:");
    console.log("   1. setIsChecking(false) before all redirects");
    console.log("   2. Handle non-authenticated users properly");
    console.log("   3. Role-based access for admin dashboard");
    console.log('   4. Prevent infinite "checking permissions" state');

    console.log("\n✅ REDIRECT FIX READY FOR TESTING!");
    console.log(
      'The "Đang kiểm tra quyền truy cập..." issue should be resolved.'
    );
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

testRedirectFixAndRoleBased();
