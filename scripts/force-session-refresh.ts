import mongoose from "mongoose";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";

async function forceRefreshUserSessions() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );

    console.log("🔄 FORCE REFRESHING USER SESSIONS\n");

    // 1. Update all employees với view_statistics permission
    console.log("1️⃣ UPDATING EMPLOYEE PERMISSIONS:\n");

    const employees = await User.find({ role: "employee" });
    let updatedCount = 0;

    for (const employee of employees) {
      console.log(`🔧 Processing ${employee.username}...`);

      let permissions = await UserPermission.findOne({ userId: employee._id });

      if (!permissions) {
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
        console.log("   ✅ Created new permissions");
        updatedCount++;
      } else {
        let updated = false;

        // Đảm bảo có các quyền cần thiết
        const requiredPerms = ["view_dashboard", "view_statistics"];

        for (const perm of requiredPerms) {
          if (!permissions.permissions.includes(perm)) {
            permissions.permissions.push(perm);
            updated = true;
            console.log(`   ➕ Added ${perm}`);
          }
        }

        if (updated) {
          await permissions.save();
          updatedCount++;
          console.log("   ✅ Updated permissions");
        } else {
          console.log("   ✅ Already has required permissions");
        }
      }

      // Force session refresh bằng cách update user record
      employee.updatedAt = new Date();
      await employee.save();
      console.log("   🔄 Forced session refresh");
      console.log("");
    }

    // 2. Update admins nếu cần
    console.log("2️⃣ CHECKING ADMIN PERMISSIONS:\n");

    const admins = await User.find({ role: "admin" });

    for (const admin of admins) {
      console.log(`👑 Processing admin ${admin.username}...`);

      let permissions = await UserPermission.findOne({ userId: admin._id });

      if (!permissions) {
        permissions = new UserPermission({
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
            "manage_payments",
            "manage_settings",
            "manage_permissions",
          ],
        });
        await permissions.save();
        console.log("   ✅ Created admin permissions");
      } else {
        console.log(
          `   ✅ Admin has ${permissions.permissions.length} permissions`
        );
      }

      // Force session refresh
      admin.updatedAt = new Date();
      await admin.save();
      console.log("   🔄 Forced session refresh");
      console.log("");
    }

    // 3. Verification
    console.log("3️⃣ FINAL VERIFICATION:\n");

    const allEmployees = await User.find({ role: "employee" });
    let passCount = 0;

    for (const emp of allEmployees) {
      const perms = await UserPermission.findOne({ userId: emp._id });
      const hasStats = perms?.permissions.includes("view_statistics") || false;
      const hasDashboard =
        perms?.permissions.includes("view_dashboard") || false;

      console.log(`👤 ${emp.username}:`);
      console.log(`   📊 view_statistics: ${hasStats ? "✅" : "❌"}`);
      console.log(`   📈 view_dashboard: ${hasDashboard ? "✅" : "❌"}`);

      if (hasStats && hasDashboard) {
        passCount++;
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   👥 Total employees: ${employees.length}`);
    console.log(
      `   ✅ Employees with stats access: ${passCount}/${employees.length}`
    );
    console.log(`   🔧 Updated permissions: ${updatedCount}`);
    console.log(`   👑 Admins processed: ${admins.length}`);

    if (passCount === employees.length) {
      console.log("\n🎉 ALL EMPLOYEES HAVE STATS ACCESS!");
    } else {
      console.log(
        `\n⚠️  ${
          employees.length - passCount
        } employees still need manual intervention`
      );
    }

    console.log(`\n🚀 NEXT STEPS:`);
    console.log(`1. 🔄 Restart backend server: npm run dev`);
    console.log(`2. 🔓 Clear browser cache and cookies`);
    console.log(`3. 🚪 Log out and log back in to frontend`);
    console.log(`4. 🧪 Test /admin/thong-ke page again`);
    console.log(`5. 🔍 Check browser network tab for 403 errors`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

forceRefreshUserSessions();
