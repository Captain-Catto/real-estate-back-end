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
    const employees = await User.find({ role: "employee" }).select(
      "username fullName"
    );
    console.log(`\n👥 Found ${employees.length} employees:`);

    let totalPermissions = 0;
    let editPostCount = 0;

    for (const employee of employees) {
      console.log(`\n👤 Checking ${employee.username} (${employee.fullName}):`);

      const permissions = await UserPermission.find({
        userId: employee._id,
      }).select("permission");

      if (permissions.length === 0) {
        console.log("  ❌ No permissions found");
      } else {
        console.log(`  ✅ Total permissions: ${permissions.length}`);
        totalPermissions += permissions.length;

        const permissionNames = permissions.map((p) => p.permission);
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

export default checkEmployeePermissions;

// Chạy function nếu file được gọi trực tiếp
if (import.meta.url === `file://${process.argv[1]}`) {
  checkEmployeePermissions();
}
