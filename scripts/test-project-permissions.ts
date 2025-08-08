import mongoose from "mongoose";
import { config } from "dotenv";
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

async function testProjectPermissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔍 KIỂM TRA QUYỀN DỰ ÁN");
    console.log("=".repeat(50));

    const employees = await User.find({ role: "employee" }).select("username");
    console.log(`\n👤 EMPLOYEE USERS (${employees.length}):`);

    let employeesWithCreateProject = 0;
    let employeesWithEditProject = 0;
    let employeesWithDeleteProject = 0;

    for (const employee of employees) {
      const permissions = await UserPermission.findOne({
        userId: employee._id,
      });

      if (permissions) {
        const projectPermissions = permissions.permissions.filter((p) =>
          p.includes("project")
        );
        console.log(
          `  • ${employee.username}: ${
            projectPermissions.join(", ") || "No project permissions"
          }`
        );

        // Count specific permissions
        if (projectPermissions.includes("create_project"))
          employeesWithCreateProject++;
        if (projectPermissions.includes("edit_project"))
          employeesWithEditProject++;
        if (projectPermissions.includes("delete_project"))
          employeesWithDeleteProject++;
      } else {
        console.log(`  • ${employee.username}: No permissions found`);
      }
    }

    console.log(`\n📊 THỐNG KÊ PROJECT PERMISSIONS:`);
    console.log(
      `  ➕ Create Project: ${employeesWithCreateProject}/${
        employees.length
      } employees (${Math.round(
        (employeesWithCreateProject / employees.length) * 100
      )}%)`
    );
    console.log(
      `  ✏️  Edit Project: ${employeesWithEditProject}/${
        employees.length
      } employees (${Math.round(
        (employeesWithEditProject / employees.length) * 100
      )}%)`
    );
    console.log(
      `  🗑️  Delete Project: ${employeesWithDeleteProject}/${
        employees.length
      } employees (${Math.round(
        (employeesWithDeleteProject / employees.length) * 100
      )}%)`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

testProjectPermissions();
