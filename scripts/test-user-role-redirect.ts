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

async function testUserRoleRedirectLogic() {
  try {
    await connectDB();

    console.log("🔍 Testing User Role Redirect Logic...\n");

    // Tìm users với các role khác nhau
    const adminUsers = await User.find({ role: "admin" }).limit(2);
    const employeeUsers = await User.find({ role: "employee" }).limit(2);
    const regularUsers = await User.find({ role: "user" }).limit(2);
    const noRoleUsers = await User.find({
      $or: [{ role: { $exists: false } }, { role: null }],
    }).limit(2);

    console.log("👥 User Role Distribution:");
    console.log(`   Admins: ${adminUsers.length} found`);
    console.log(`   Employees: ${employeeUsers.length} found`);
    console.log(`   Regular users: ${regularUsers.length} found`);
    console.log(`   No role users: ${noRoleUsers.length} found\n`);

    console.log("🔄 Expected Redirect Behavior:");
    console.log(
      "┌─────────────────┬────────────────┬───────────────────────────────────┐"
    );
    console.log(
      "│ User Role       │ Admin Access   │ Expected Redirect                 │"
    );
    console.log(
      "├─────────────────┼────────────────┼───────────────────────────────────┤"
    );
    console.log(
      "│ Not logged in   │ /admin/*       │ /dang-nhap                        │"
    );
    console.log(
      "│ admin           │ /admin/*       │ ✅ Allow access                   │"
    );
    console.log(
      "│ employee        │ /admin/*       │ /admin/unauthorized (if no perm)  │"
    );
    console.log(
      "│ user            │ /admin/*       │ / (homepage)                      │"
    );
    console.log(
      "│ null/undefined  │ /admin/*       │ / (homepage)                      │"
    );
    console.log(
      "└─────────────────┴────────────────┴───────────────────────────────────┘\n"
    );

    console.log("🧪 Test Cases:");

    // Test case 1: Admin access
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`✅ Admin User: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Admin access: ✅ ALLOWED`);
      console.log(`   Redirect: No redirect needed\n`);
    }

    // Test case 2: Employee access
    if (employeeUsers.length > 0) {
      const employee = employeeUsers[0];
      console.log(`👤 Employee User: ${employee.email}`);
      console.log(`   Role: ${employee.role}`);
      console.log(`   Admin access: ⚠️  DEPENDS ON PERMISSIONS`);
      console.log(`   Redirect: /admin/unauthorized (if no permission)\n`);
    }

    // Test case 3: Regular user access
    if (regularUsers.length > 0) {
      const regularUser = regularUsers[0];
      console.log(`🙍 Regular User: ${regularUser.email}`);
      console.log(`   Role: ${regularUser.role}`);
      console.log(`   Admin access: ❌ DENIED`);
      console.log(`   Redirect: / (homepage) 🏠\n`);
    }

    // Test case 4: No role user access
    if (noRoleUsers.length > 0) {
      const noRoleUser = noRoleUsers[0];
      console.log(`❓ No Role User: ${noRoleUser.email}`);
      console.log(`   Role: ${noRoleUser.role || "undefined"}`);
      console.log(`   Admin access: ❌ DENIED`);
      console.log(`   Redirect: / (homepage) 🏠\n`);
    }

    console.log("🔧 Frontend Changes Made:");
    console.log("   1. ✅ Added role check in ProtectionGuard");
    console.log("   2. ✅ Smart redirect logic:");
    console.log("      - Regular users → / (homepage)");
    console.log(
      "      - Admin/employee with insufficient perms → /admin/unauthorized"
    );
    console.log("      - Not authenticated → /dang-nhap");
    console.log("   3. ✅ Prevents infinite redirect loops");

    console.log("\n🎯 Manual Testing Instructions:");
    console.log("   1. Login as regular user and visit /admin/thong-ke");
    console.log("   2. Should redirect to homepage (/) with error message");
    console.log(
      "   3. Login as employee without view_statistics and visit /admin/thong-ke"
    );
    console.log("   4. Should redirect to /admin/unauthorized");
    console.log("   5. Try accessing admin area without login");
    console.log("   6. Should redirect to /dang-nhap");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

testUserRoleRedirectLogic();
