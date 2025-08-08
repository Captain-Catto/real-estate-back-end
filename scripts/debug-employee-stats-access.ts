import mongoose from "mongoose";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";

async function debugEmployeeStatsAccess() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );

    console.log("🔍 DEBUGGING EMPLOYEE STATS ACCESS\n");

    // 1. Tìm tất cả employees
    const employees = await User.find({ role: "employee" });
    console.log(`👥 Found ${employees.length} employees\n`);

    for (const employee of employees) {
      console.log(`👤 Employee: ${employee.username} (${employee.email})`);

      // Kiểm tra permissions
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!permissions) {
        console.log("❌ No permissions record found");
        console.log("🔧 Creating permissions...");

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
        console.log("✅ Created permissions record");
      } else {
        console.log(
          `📋 Current permissions: ${permissions.permissions.join(", ")}`
        );

        // Kiểm tra các quyền quan trọng
        const hasViewStats =
          permissions.permissions.includes("view_statistics");
        const hasViewDashboard =
          permissions.permissions.includes("view_dashboard");

        console.log(`   📊 view_statistics: ${hasViewStats ? "✅" : "❌"}`);
        console.log(`   📈 view_dashboard: ${hasViewDashboard ? "✅" : "❌"}`);

        // Thêm quyền nếu thiếu
        let updated = false;
        if (!hasViewStats) {
          permissions.permissions.push("view_statistics");
          updated = true;
          console.log("   ➕ Added view_statistics");
        }
        if (!hasViewDashboard) {
          permissions.permissions.push("view_dashboard");
          updated = true;
          console.log("   ➕ Added view_dashboard");
        }

        if (updated) {
          await permissions.save();
          console.log("   💾 Saved updated permissions");
        }
      }

      console.log("");
    }

    // 2. Kiểm tra admin permissions
    console.log("👑 CHECKING ADMIN PERMISSIONS:\n");
    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.username} (${admin.email})`);

      const permissions = await UserPermission.findOne({ userId: admin._id });
      if (!permissions) {
        console.log(
          "❌ Admin has no permissions record - this might be the issue!"
        );

        const adminPermissions = new UserPermission({
          userId: admin._id,
          permissions: [
            "view_dashboard",
            "view_statistics",
            "view_posts",
            "view_users",
            "create_posts",
            "edit_posts",
            "delete_posts",
            "create_users",
            "edit_users",
            "delete_users",
            "manage_categories",
            "manage_projects",
            "manage_developers",
          ],
        });
        await adminPermissions.save();
        console.log("✅ Created admin permissions");
      } else {
        console.log(
          `📋 Admin permissions: ${permissions.permissions.length} total`
        );
        console.log(
          `   📊 view_statistics: ${
            permissions.permissions.includes("view_statistics") ? "✅" : "❌"
          }`
        );
      }
      console.log("");
    }

    // 3. Test permission check logic
    console.log("🧪 TESTING PERMISSION CHECK LOGIC:\n");

    const testEmployee = employees[0];
    if (testEmployee) {
      const testPermissions = await UserPermission.findOne({
        userId: testEmployee._id,
      });

      console.log(`Testing with: ${testEmployee.username}`);
      console.log(`Role: ${testEmployee.role}`);
      console.log(`Has permissions record: ${!!testPermissions}`);

      if (testPermissions) {
        console.log(
          `Permissions array: [${testPermissions.permissions.join(", ")}]`
        );

        // Test các permission checks
        const checks = [
          "view_statistics",
          "view_dashboard",
          "view_posts",
          "view_users",
        ];

        console.log("\nPermission checks:");
        checks.forEach((perm) => {
          const has = testPermissions.permissions.includes(perm);
          console.log(`   ${perm}: ${has ? "✅ PASS" : "❌ FAIL"}`);
        });

        // Simulate middleware check
        console.log("\n🔒 Simulating middleware check for 'view_statistics':");
        if (testEmployee.role === "admin") {
          console.log("✅ Admin - would pass");
        } else {
          const hasStats =
            testPermissions.permissions.includes("view_statistics");
          console.log(
            `${
              hasStats ? "✅ PASS" : "❌ FAIL"
            } - Employee with view_statistics: ${hasStats}`
          );
        }
      }
    }

    console.log("\n📋 SUMMARY:");
    console.log(`   👥 Total employees: ${employees.length}`);
    console.log(`   👑 Total admins: ${admins.length}`);

    // Final verification
    const finalCheck = await UserPermission.find({});
    const usersWithStats = finalCheck.filter((p) =>
      p.permissions.includes("view_statistics")
    );
    console.log(`   📊 Users with view_statistics: ${usersWithStats.length}`);

    console.log("\n🚀 NEXT STEPS:");
    console.log("1. 🔄 Restart the backend server");
    console.log("2. 🔓 Clear browser cache/cookies");
    console.log("3. 🚪 Log out and log back in");
    console.log("4. 🧪 Test /admin/thong-ke again");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

debugEmployeeStatsAccess();
