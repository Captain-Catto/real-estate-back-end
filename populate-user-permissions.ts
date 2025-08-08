import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "employee", "user"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "pending"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserPermissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  permissions: [
    {
      type: String,
      required: true,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
const UserPermission = mongoose.model("UserPermission", UserPermissionSchema);

// Default permissions for different roles
const defaultPermissions = {
  admin: [
    // Users management - full access
    "view_users",
    "create_user",
    "edit_user",
    "delete_user",
    "change_user_role",
    "change_user_status",
    "reset_user_password",
    "approve_user",

    // Posts management - full access
    "view_posts",
    "create_post",
    "edit_post",
    "delete_post",
    "approve_post",
    "reject_post",
    "feature_post",
    "view_deleted_posts",
    "restore_post",

    // Projects management - full access
    "view_projects",
    "create_project",
    "edit_project",
    "delete_project",

    // News management - full access
    "view_news",
    "create_news",
    "edit_news",
    "delete_news",
    "feature_news",
    "manage_news_categories",

    // Transactions management - full access
    "view_transactions",
    "approve_transaction",
    "reject_transaction",
    "view_transaction_history",
    "create_refund",
    "generate_invoice",

    // Statistics - full access
    "view_statistics",
    "export_statistics",
    "generate_reports",
    "view_financial_stats",

    // Settings - full access
    "view_settings",
    "edit_settings",
    "manage_sidebar",
    "manage_header",

    // Locations - full access
    "view_locations",
    "manage_locations",
    "manage_areas",
    "manage_prices",
  ],

  employee: [
    // Basic view permissions that all employees have
    "view_users",
    "view_posts",
    "create_post",
    "edit_post",
    "view_projects",
    "view_news",
    "create_news",
    "edit_news",
    "view_transactions",
    "view_statistics",
    "view_settings",
    "view_locations",
  ],
};

// Manageable employee permissions (admin can enable/disable these for employees)
const manageableEmployeePermissions = [
  "create_user",
  "edit_user",
  "delete_user",
  "change_user_status",
  "delete_post",
  "approve_post",
  "reject_post",
  "feature_post",
  "create_project",
  "edit_project",
  "delete_news",
  "feature_news",
  "manage_news_categories",
  "approve_transaction",
  "reject_transaction",
  "export_statistics",
  "generate_reports",
  "edit_settings",
  "manage_locations",
  "manage_areas",
  "manage_prices",
];

async function connectToDatabase() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

async function createSampleUsers() {
  try {
    console.log("🔍 Checking for existing users...");

    // Check if admin exists
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("🔨 Creating sample admin user...");
      adminUser = new User({
        username: "admin",
        email: "admin@realestate.com",
        password:
          "$2b$10$K7L/8Y75Q2VZ5N5r2sY4YeU.jRhO3VGJt2oP6kL8N5Q2VZ5N5r2sY4", // "admin123"
        role: "admin",
        status: "active",
      });
      await adminUser.save();
      console.log("✅ Admin user created successfully");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Check if employee exists
    let employeeUser = await User.findOne({ role: "employee" });
    if (!employeeUser) {
      console.log("🔨 Creating sample employee user...");
      employeeUser = new User({
        username: "employee1",
        email: "employee1@realestate.com",
        password:
          "$2b$10$K7L/8Y75Q2VZ5N5r2sY4YeU.jRhO3VGJt2oP6kL8N5Q2VZ5N5r2sY4", // "employee123"
        role: "employee",
        status: "active",
      });
      await employeeUser.save();
      console.log("✅ Employee user created successfully");
    } else {
      console.log("✅ Employee user already exists");
    }

    return { adminUser, employeeUser };
  } catch (error) {
    console.error("❌ Error creating sample users:", error);
    throw error;
  }
}

async function populateUserPermissions() {
  try {
    console.log("🔍 Checking existing permissions...");

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users in database`);

    for (const user of users) {
      const existingPermission = await UserPermission.findOne({
        userId: user._id,
      });

      if (existingPermission) {
        console.log(
          `✅ Permissions already exist for ${user.role}: ${user.username}`
        );
        continue;
      }

      let userPermissions: string[] = [];

      if (user.role === "admin") {
        userPermissions = defaultPermissions.admin;
        console.log(`🔨 Creating admin permissions for: ${user.username}`);
      } else if (user.role === "employee") {
        userPermissions = defaultPermissions.employee;
        console.log(`🔨 Creating employee permissions for: ${user.username}`);
      } else {
        console.log(`⏭️  Skipping regular user: ${user.username}`);
        continue;
      }

      const newPermission = new UserPermission({
        userId: user._id,
        permissions: userPermissions,
      });

      await newPermission.save();
      console.log(
        `✅ Permissions created for ${user.role}: ${user.username} (${userPermissions.length} permissions)`
      );
    }
  } catch (error) {
    console.error("❌ Error populating user permissions:", error);
    throw error;
  }
}

async function showPermissionsSummary() {
  try {
    console.log("\n📋 PERMISSIONS SUMMARY");
    console.log("=".repeat(50));

    const permissions = await UserPermission.find({}).populate(
      "userId",
      "username email role"
    );

    for (const perm of permissions) {
      const user = perm.userId as any;
      console.log(`\n👤 User: ${user.username} (${user.role})`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Permissions (${perm.permissions.length}):`);

      // Group permissions by category for better display
      const groupedPermissions: { [key: string]: string[] } = {};

      perm.permissions.forEach((permission: string) => {
        const category = permission.split("_")[1] || "other";
        if (!groupedPermissions[category]) {
          groupedPermissions[category] = [];
        }
        groupedPermissions[category].push(permission);
      });

      Object.entries(groupedPermissions).forEach(([category, perms]) => {
        console.log(`   📂 ${category}: ${perms.join(", ")}`);
      });
    }

    console.log("\n🎯 MANAGEABLE EMPLOYEE PERMISSIONS");
    console.log("=".repeat(50));
    console.log("Admin can enable/disable these permissions for employees:");
    manageableEmployeePermissions.forEach((perm) => {
      console.log(`   🔧 ${perm}`);
    });
  } catch (error) {
    console.error("❌ Error showing permissions summary:", error);
  }
}

async function main() {
  try {
    console.log("🚀 Starting User Permissions Population Script");
    console.log("=".repeat(50));

    // Connect to database
    await connectToDatabase();

    // Create sample users if they don't exist
    await createSampleUsers();

    // Populate permissions for existing users
    await populateUserPermissions();

    // Show summary
    await showPermissionsSummary();

    console.log("\n✅ User permissions population completed successfully!");
    console.log("\n📚 NEXT STEPS:");
    console.log("1. Start your backend server: npm run dev");
    console.log("2. Test the permissions API endpoints:");
    console.log("   - GET /api/permissions/available");
    console.log("   - GET /api/permissions/employees");
    console.log("   - PUT /api/permissions/employee/:userId");
    console.log(
      "3. Use the frontend admin panel to manage employee permissions"
    );
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { defaultPermissions, manageableEmployeePermissions };
