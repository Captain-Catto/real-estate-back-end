import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb://localhost:27017";
const DATABASE_NAME = "real-estate";

async function debugCategoryPageAccess() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(DATABASE_NAME);
    const userPermissionsCollection = db.collection("userpermissions");

    // Tìm employee1
    const employee1Permissions = await userPermissionsCollection.findOne({
      userId: "employee1",
    });

    console.log("\n=== EMPLOYEE1 PERMISSION DEBUG ===");
    console.log("Employee1 permissions found:", !!employee1Permissions);

    if (employee1Permissions) {
      console.log(
        "\nTotal permissions:",
        employee1Permissions.permissions?.length || 0
      );
      console.log("\nAll permissions:", employee1Permissions.permissions);

      // Kiểm tra 2 quyền cần thiết
      const requiredPermissions = [
        "manage_categories",
        "manage_news_categories",
      ];
      console.log("\n=== REQUIRED PERMISSIONS CHECK ===");

      requiredPermissions.forEach((permission) => {
        const hasPermission =
          employee1Permissions.permissions?.includes(permission);
        console.log(
          `${permission}: ${hasPermission ? "✅ HAS" : "❌ MISSING"}`
        );
      });

      // Kiểm tra quyền settings và news
      const settingsPermissions = employee1Permissions.permissions?.filter(
        (p: string) => p.includes("manage_categories") || p.includes("settings")
      );
      const newsPermissions = employee1Permissions.permissions?.filter(
        (p: string) => p.includes("news")
      );

      console.log("\n=== CATEGORY RELATED PERMISSIONS ===");
      console.log("Settings/Categories permissions:", settingsPermissions);
      console.log("News permissions:", newsPermissions);

      // Simulate frontend permission check
      console.log("\n=== FRONTEND SIMULATION ===");
      const PERMISSIONS = {
        SETTINGS: {
          MANAGE_CATEGORIES: "manage_categories",
        },
        NEWS: {
          MANAGE_CATEGORIES: "manage_news_categories",
        },
      };

      const can = (permission: string) => {
        return employee1Permissions.permissions?.includes(permission) || false;
      };

      const hasPropertyAccess = can(PERMISSIONS.SETTINGS.MANAGE_CATEGORIES);
      const hasNewsAccess = can(PERMISSIONS.NEWS.MANAGE_CATEGORIES);

      console.log(
        `can(PERMISSIONS.SETTINGS.MANAGE_CATEGORIES): ${hasPropertyAccess}`
      );
      console.log(`can(PERMISSIONS.NEWS.MANAGE_CATEGORIES): ${hasNewsAccess}`);
      console.log(`Should allow access: ${hasPropertyAccess || hasNewsAccess}`);

      if (!hasPropertyAccess && !hasNewsAccess) {
        console.log(
          "🚫 REASON FOR REDIRECT: No access to either property or news categories"
        );
      } else {
        console.log("✅ Should have access to category management page");
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

debugCategoryPageAccess();
