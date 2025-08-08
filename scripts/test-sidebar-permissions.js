const mongoose = require("mongoose");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function testSidebarPermissions() {
  try {
    console.log("🔍 Testing Sidebar Permission System...\n");

    // Define schemas
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const UserPermissionSchema = new mongoose.Schema({}, { strict: false });
    const SidebarConfigSchema = new mongoose.Schema({}, { strict: false });

    const User = mongoose.model("User", UserSchema);
    const UserPermission = mongoose.model(
      "UserPermission",
      UserPermissionSchema
    );
    const SidebarConfig = mongoose.model("SidebarConfig", SidebarConfigSchema);

    // 1. Get sidebar config
    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      throw new Error("No sidebar config found");
    }

    console.log("📋 SIDEBAR CONFIG ANALYSIS");
    console.log("=".repeat(50));
    console.log(`Config name: ${sidebarConfig.name}`);
    console.log(`Total items: ${sidebarConfig.items.length}`);

    // Count items by type
    const groups = sidebarConfig.items.filter((item) => item.metadata?.isGroup);
    const menuItems = sidebarConfig.items.filter(
      (item) => !item.metadata?.isGroup
    );
    console.log(`Groups: ${groups.length}`);
    console.log(`Menu items: ${menuItems.length}`);

    // 2. Analyze permissions for each item
    console.log("\n📊 PERMISSION ANALYSIS BY ITEM");
    console.log("=".repeat(50));

    sidebarConfig.items.forEach((item) => {
      const permissions = item.metadata?.permissions || [];
      const roles = item.allowedRoles || [];

      console.log(`\n📁 ${item.title} (${item.id})`);
      console.log(`   Roles: [${roles.join(", ")}]`);
      console.log(
        `   Permissions: [${
          permissions.join(", ") || "None (role-based only)"
        }]`
      );
    });

    // 3. Test with sample users
    console.log("\n👥 USER ACCESS SIMULATION");
    console.log("=".repeat(50));

    // Get sample users
    const adminUser = await User.findOne({ role: "admin" });
    const employeeUser = await User.findOne({ role: "employee" });

    if (!adminUser || !employeeUser) {
      console.log("⚠️  Missing sample users, creating them...");
      return;
    }

    // Get employee permissions
    const employeePermissions = await UserPermission.findOne({
      userId: employeeUser._id,
    });
    const empPermissionsList = employeePermissions
      ? employeePermissions.permissions
      : [];

    console.log(`\n👑 ADMIN USER: ${adminUser.username}`);
    console.log("   Status: Has access to ALL items (admin privilege)");

    console.log(`\n👤 EMPLOYEE USER: ${employeeUser.username}`);
    console.log(
      `   Permissions: ${empPermissionsList.length} total permissions`
    );
    console.log(
      `   Permissions: [${empPermissionsList.slice(0, 5).join(", ")}${
        empPermissionsList.length > 5 ? "..." : ""
      }]`
    );

    // Simulate access check for employee
    let employeeAccessCount = 0;
    let employeeBlockedItems = [];

    sidebarConfig.items.forEach((item) => {
      // Check role access
      const hasRoleAccess = item.allowedRoles.includes("employee");
      if (!hasRoleAccess) return;

      // Check permission access
      const requiredPermissions = item.metadata?.permissions || [];
      const hasPermissionAccess =
        requiredPermissions.length === 0 ||
        requiredPermissions.some((perm) => empPermissionsList.includes(perm));

      if (hasPermissionAccess) {
        employeeAccessCount++;
      } else {
        employeeBlockedItems.push({
          title: item.title,
          requiredPermissions: requiredPermissions,
        });
      }
    });

    console.log(`\n📊 EMPLOYEE ACCESS SUMMARY:`);
    console.log(`✅ Accessible items: ${employeeAccessCount}`);
    console.log(`❌ Blocked items: ${employeeBlockedItems.length}`);

    if (employeeBlockedItems.length > 0) {
      console.log("\n🚫 BLOCKED ITEMS FOR EMPLOYEE:");
      employeeBlockedItems.forEach((item) => {
        console.log(
          `   - ${item.title}: needs [${item.requiredPermissions.join(", ")}]`
        );
      });
    }

    // 4. Permission coverage analysis
    console.log("\n🔍 PERMISSION COVERAGE ANALYSIS");
    console.log("=".repeat(50));

    // Get all unique permissions used in sidebar
    const allSidebarPermissions = new Set();
    sidebarConfig.items.forEach((item) => {
      const permissions = item.metadata?.permissions || [];
      permissions.forEach((perm) => allSidebarPermissions.add(perm));
    });

    console.log(
      `Total unique permissions in sidebar: ${allSidebarPermissions.size}`
    );
    console.log(
      `Permissions: [${Array.from(allSidebarPermissions).join(", ")}]`
    );

    // Check coverage
    const uncoveredPermissions = Array.from(allSidebarPermissions).filter(
      (perm) => !empPermissionsList.includes(perm)
    );

    if (uncoveredPermissions.length > 0) {
      console.log(
        `\n⚠️  Employee missing permissions: [${uncoveredPermissions.join(
          ", "
        )}]`
      );
    } else {
      console.log("\n✅ Employee has all required permissions!");
    }

    console.log("\n🎉 Permission system test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function main() {
  await connectDatabase();
  await testSidebarPermissions();

  console.log("\n✨ Closing database connection...");
  await mongoose.connection.close();
  console.log("👋 Database connection closed");
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSidebarPermissions };
