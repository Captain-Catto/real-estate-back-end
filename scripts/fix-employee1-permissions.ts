import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017";
const DATABASE_NAME = "real-estate";

async function fixEmployee1Permissions() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DATABASE_NAME);
    const userPermissionsCollection = db.collection("userpermissions");
    const usersCollection = db.collection("users");

    // Kiểm tra user employee1 có tồn tại không
    const employee1User = await usersCollection.findOne({
      username: "employee1",
    });
    console.log("Employee1 user exists:", !!employee1User);

    if (employee1User) {
      console.log("Employee1 ID:", employee1User._id);
      console.log("Employee1 role:", employee1User.role);
    }

    // Tìm tất cả permissions hiện có
    const allPermissions = await userPermissionsCollection.find({}).toArray();
    console.log("\n=== ALL USER PERMISSIONS ===");
    allPermissions.forEach((perm) => {
      console.log(
        `UserID: ${perm.userId}, Permissions count: ${
          perm.permissions?.length || 0
        }`
      );
    });

    // Kiểm tra employee1 permissions
    let employee1Permissions = await userPermissionsCollection.findOne({
      userId: "employee1",
    });

    if (!employee1Permissions) {
      console.log("\n❌ Employee1 permissions not found. Creating...");

      // Tạo permissions cho employee1 với đầy đủ quyền cần thiết
      const permissions = [
        // Basic permissions
        "view_dashboard",
        "view_statistics",
        "view_admin_dashboard",

        // Category management permissions
        "manage_categories",
        "manage_news_categories",

        // Other essential permissions
        "view_properties",
        "view_news",
        "view_users",
        "view_projects",
        "view_analytics",
        "view_reports",
        "view_settings",

        // News permissions
        "create_news",
        "edit_news",
        "delete_news",
        "view_news_list",

        // Property permissions
        "view_property_list",
        "view_property_details",

        // Project permissions
        "view_project_list",
        "view_project_details",

        // User management (limited)
        "view_user_list",

        // Analytics
        "view_property_analytics",
        "view_user_analytics",
        "view_financial_analytics",

        // Sidebar access
        "access_admin_sidebar",
        "access_dashboard",
        "access_statistics",
        "access_news_management",
        "access_category_management",
        "access_property_management",
        "access_project_management",
        "access_user_management",
        "access_analytics",
        "access_settings",
      ];

      const result = await userPermissionsCollection.insertOne({
        userId: "employee1",
        permissions: permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ Created permissions for employee1:", result.insertedId);
      console.log("Total permissions added:", permissions.length);

      // Verify the creation
      employee1Permissions = await userPermissionsCollection.findOne({
        userId: "employee1",
      });
    }

    if (employee1Permissions) {
      console.log("\n=== EMPLOYEE1 FINAL PERMISSIONS ===");
      console.log(
        "Total permissions:",
        employee1Permissions.permissions?.length || 0
      );

      // Check specific category permissions
      const hasManageCategories =
        employee1Permissions.permissions?.includes("manage_categories");
      const hasManageNewsCategories =
        employee1Permissions.permissions?.includes("manage_news_categories");

      console.log("\n=== CATEGORY PERMISSIONS ===");
      console.log(`manage_categories: ${hasManageCategories ? "✅" : "❌"}`);
      console.log(
        `manage_news_categories: ${hasManageNewsCategories ? "✅" : "❌"}`
      );
      console.log(
        `Should have access: ${
          hasManageCategories || hasManageNewsCategories ? "✅" : "❌"
        }`
      );

      if (hasManageCategories && hasManageNewsCategories) {
        console.log(
          "\n🎉 Employee1 now has full access to category management!"
        );
        console.log(
          "Please try accessing http://localhost:3000/admin/quan-ly-danh-muc again"
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

fixEmployee1Permissions();
