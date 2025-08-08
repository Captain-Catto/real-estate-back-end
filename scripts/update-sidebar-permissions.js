const mongoose = require("mongoose");
const path = require("path");

// Connect to MongoDB
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// SidebarConfig Schema (inline definition)
const SidebarConfigSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        path: { type: String, required: true },
        parentId: { type: String },
        order: { type: Number, required: true },
        isVisible: { type: Boolean, default: true },
        allowedRoles: [{ type: String, enum: ["admin", "employee"] }],
        metadata: {
          isGroup: { type: Boolean, default: false },
          icon: String,
          badge: String,
          permissions: [String], // Add permissions array
        },
      },
    ],
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Permission mapping for each menu item
const menuPermissionsMap = {
  // GROUPS (no specific permissions needed, just role-based)
  "main-group": [],
  "content-group": [],
  "users-group": [],
  "system-group": [],

  // MAIN GROUP ITEMS
  dashboard: ["view_statistics"], // Dashboard needs statistics view permission
  statistics: ["view_statistics"], // Statistics page

  // CONTENT GROUP ITEMS
  posts: ["view_posts"], // Can view posts
  news: ["view_posts"], // Can view news (using same permission group)
  projects: ["view_projects"], // Can view projects

  // USERS GROUP ITEMS (Admin only based on allowedRoles)
  "all-users": ["view_users"], // View all users
  employees: ["view_users"], // View employees

  // SYSTEM GROUP ITEMS (Admin only)
  "general-settings": ["view_settings"], // View general settings
  "sidebar-config": ["edit_settings"], // Can edit sidebar configuration
};

// Employee default permissions (what every employee has by default)
const employeeDefaultPermissions = [
  "view_users",
  "view_posts",
  "create_post",
  "edit_post",
  "view_projects",
  "view_news",
  "create_news",
  "edit_news",
  "view_statistics",
  "view_settings",
  "view_locations",
];

async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function updateSidebarPermissions() {
  try {
    console.log("🔐 Starting sidebar permissions update...");

    // Define the model
    const SidebarConfig = mongoose.model("SidebarConfig", SidebarConfigSchema);

    // Find the current config
    const config = await SidebarConfig.findOne({ isDefault: true });
    if (!config) {
      throw new Error("No default sidebar config found");
    }

    console.log(`📋 Found sidebar config: ${config.name}`);
    console.log(`📊 Total items: ${config.items.length}`);

    // Update each item with permissions
    let updatedCount = 0;

    config.items = config.items.map((item) => {
      const itemPermissions = menuPermissionsMap[item.id] || [];

      // Ensure metadata exists
      if (!item.metadata) {
        item.metadata = {};
      }

      // Add permissions to metadata
      item.metadata.permissions = itemPermissions;

      // Log the update
      if (itemPermissions.length > 0) {
        console.log(
          `🔑 ${item.title} (${item.id}): ${itemPermissions.join(", ")}`
        );
        updatedCount++;
      } else {
        console.log(
          `📝 ${item.title} (${item.id}): No specific permissions (role-based only)`
        );
      }

      return item;
    });

    // Save the updated configuration
    await config.save();

    console.log("\n📊 Update Summary:");
    console.log(`✅ Updated ${updatedCount} items with specific permissions`);
    console.log(
      `📋 ${
        config.items.length - updatedCount
      } items use role-based access only`
    );

    // Show permission summary by role
    console.log("\n👥 Access Summary by Role:");

    // Admin access (all items)
    const adminItems = config.items.filter((item) =>
      item.allowedRoles.includes("admin")
    );
    console.log(`👑 Admin: ${adminItems.length} items accessible (all)`);

    // Employee access (role-based + permission-based)
    const employeeRoleItems = config.items.filter((item) =>
      item.allowedRoles.includes("employee")
    );
    const employeePermissionItems = employeeRoleItems.filter((item) => {
      const requiredPermissions = item.metadata?.permissions || [];
      if (requiredPermissions.length === 0) return true; // No permissions required
      return requiredPermissions.some((perm) =>
        employeeDefaultPermissions.includes(perm)
      );
    });

    console.log(
      `👤 Employee: ${employeePermissionItems.length}/${employeeRoleItems.length} items accessible`
    );
    console.log(`   - Role-based items: ${employeeRoleItems.length}`);
    console.log(
      `   - Permission-filtered items: ${employeePermissionItems.length}`
    );

    // List items employee CANNOT access
    const blockedItems = employeeRoleItems.filter((item) => {
      const requiredPermissions = item.metadata?.permissions || [];
      if (requiredPermissions.length === 0) return false;
      return !requiredPermissions.some((perm) =>
        employeeDefaultPermissions.includes(perm)
      );
    });

    if (blockedItems.length > 0) {
      console.log("\n🚫 Items blocked for employees:");
      blockedItems.forEach((item) => {
        console.log(
          `   - ${item.title}: requires [${item.metadata.permissions.join(
            ", "
          )}]`
        );
      });
    }

    console.log("\n🎉 Sidebar permissions update completed successfully!");
    console.log(
      "💡 Employee users will now see menus based on both role AND permissions"
    );
  } catch (error) {
    console.error("❌ Update failed:", error);
    process.exit(1);
  }
}

async function main() {
  await connectDatabase();
  await updateSidebarPermissions();

  console.log("\n✨ All done! Closing database connection...");
  await mongoose.connection.close();
  console.log("👋 Database connection closed");
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateSidebarPermissions, menuPermissionsMap };
