import { config } from "dotenv";
import fetch from "node-fetch";

config();

const API_BASE_URL = "http://localhost:8080";

async function testPermissionAPI() {
  try {
    console.log("🔍 KIỂM TRA API PERMISSION");
    console.log("=".repeat(50));

    // Test getAvailablePermissions endpoint
    const response = await fetch(`${API_BASE_URL}/api/permissions/available`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.log("❌ API không phản hồi hoặc server chưa chạy");
      console.log("💡 Hãy chạy: cd real-estate-back-end && npm run dev");
      return;
    }

    const data = await response.json();

    console.log("\n📋 MANAGEABLE EMPLOYEE PERMISSIONS:");
    const manageablePerms = data.data.manageableEmployeePermissions;

    // Lọc project permissions
    const projectPerms = manageablePerms.filter((perm) =>
      perm.includes("project")
    );
    console.log("📁 Project permissions:", projectPerms);

    // Kiểm tra delete_project có trong danh sách không
    const hasDeleteProject = projectPerms.includes("delete_project");
    console.log(
      `\n✅ delete_project có trong manageable permissions: ${
        hasDeleteProject ? "YES" : "NO"
      }`
    );

    if (hasDeleteProject) {
      console.log("🎉 Backend đã được cập nhật thành công!");
    } else {
      console.log("❌ Backend cần được cập nhật thêm delete_project");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("💡 Đảm bảo backend server đang chạy tại localhost:8080");
  }
}

testPermissionAPI();
