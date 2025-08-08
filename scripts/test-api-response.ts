import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017";
const DATABASE_NAME = "real-estate";

// Simulate the backend PermissionController.getUserPermissions
async function simulateGetUserPermissions(userId: string) {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const userPermissionsCollection = db.collection("userpermissions");

    // This simulates the exact logic from backend PermissionController
    const userPermissions = await userPermissionsCollection.findOne({ userId });

    if (!userPermissions) {
      return {
        success: false,
        message: "User permissions not found",
        data: { permissions: [] },
      };
    }

    return {
      success: true,
      data: {
        permissions: userPermissions.permissions || [],
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Error fetching permissions",
      data: { permissions: [] },
    };
  } finally {
    await client.close();
  }
}

async function testAPIResponse() {
  console.log("=== SIMULATING API CALL FOR EMPLOYEE1 ===");

  const response = await simulateGetUserPermissions("employee1");

  console.log("API Response:", JSON.stringify(response, null, 2));

  if (response.success) {
    const permissions = response.data.permissions;
    console.log(`\nTotal permissions returned: ${permissions.length}`);

    // Check specific permissions needed for category management
    const hasManageCategories = permissions.includes("manage_categories");
    const hasManageNewsCategories = permissions.includes(
      "manage_news_categories"
    );

    console.log("\n=== CATEGORY ACCESS CHECK ===");
    console.log(`manage_categories: ${hasManageCategories ? "✅" : "❌"}`);
    console.log(
      `manage_news_categories: ${hasManageNewsCategories ? "✅" : "❌"}`
    );

    // Simulate frontend logic
    const PERMISSIONS = {
      SETTINGS: {
        MANAGE_CATEGORIES: "manage_categories",
      },
      NEWS: {
        MANAGE_CATEGORIES: "manage_news_categories",
      },
    };

    const can = (permission: string) => permissions.includes(permission);

    const hasPropertyAccess = can(PERMISSIONS.SETTINGS.MANAGE_CATEGORIES);
    const hasNewsAccess = can(PERMISSIONS.NEWS.MANAGE_CATEGORIES);

    console.log("\n=== FRONTEND ACCESS SIMULATION ===");
    console.log(`hasPropertyAccess: ${hasPropertyAccess}`);
    console.log(`hasNewsAccess: ${hasNewsAccess}`);
    console.log(
      `Overall access: ${
        hasPropertyAccess || hasNewsAccess ? "✅ ALLOWED" : "❌ DENIED"
      }`
    );

    if (hasPropertyAccess || hasNewsAccess) {
      console.log(
        "\n🎉 Employee1 should now be able to access /admin/quan-ly-danh-muc"
      );
      console.log("Available tabs:");
      if (hasPropertyAccess)
        console.log("  - Property Categories (Danh mục BĐS)");
      if (hasNewsAccess) console.log("  - News Categories (Danh mục tin tức)");
    } else {
      console.log(
        "\n❌ Employee1 will be redirected from /admin/quan-ly-danh-muc"
      );
    }
  } else {
    console.log("\n❌ API call failed:", response.message);
  }
}

testAPIResponse();
