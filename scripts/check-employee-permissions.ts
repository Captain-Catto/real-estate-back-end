import mongoose from "mongoose";
import { config } from "dotenv";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

async function checkEmployeePermissions() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Lấy tất cả employee
    const employees = await User.find({ role: "employee" }).select("username");
    console.log(`\n👥 Found ${employees.length} employees:`);

    let totalPermissions = 0;
    let editPostCount = 0;

    for (const employee of employees) {
      console.log(`\n👤 Checking ${employee.username}:`);

      const userPermission = await UserPermission.findOne({
        userId: employee._id,
      });

      if (!userPermission || userPermission.permissions.length === 0) {
        console.log("  ❌ No permissions found");
      } else {
        console.log(
          `  ✅ Total permissions: ${userPermission.permissions.length}`
        );
        totalPermissions += userPermission.permissions.length;

        const permissionNames = userPermission.permissions;
        const hasEditPost = permissionNames.includes("edit_post");

        if (hasEditPost) {
          console.log("  ✅ Has edit_post permission");
          editPostCount++;
        } else {
          console.log("  ❌ No edit_post permission");
        }

        // Hiển thị một số permissions quan trọng
        const importantPerms = [
          "edit_post",
          "create_post",
          "view_posts",
          "delete_post",
        ];
        const foundImportant = importantPerms.filter((perm) =>
          permissionNames.includes(perm)
        );
        if (foundImportant.length > 0) {
          console.log(`  📋 Post permissions: ${foundImportant.join(", ")}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`👥 Employees checked: ${employees.length}`);
    console.log(`🔒 Total permissions found: ${totalPermissions}`);
    console.log(
      `✏️ Employees with edit_post: ${editPostCount}/${
        employees.length
      } (${Math.round((editPostCount / employees.length) * 100)}%)`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
  }
}

checkEmployeePermissions();
