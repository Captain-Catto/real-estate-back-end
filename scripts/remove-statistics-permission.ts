import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import UserPermission from "../src/models/UserPermission";
import { User } from "../src/models/User";

// MongoDB connection
async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function removeStatisticsPermissionFromAllEmployees() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Tìm tất cả employees
    const employees = await User.find({ role: "employee", status: "active" });
    console.log(`👥 Found ${employees.length} employees`);

    let removedCount = 0;

    for (const employee of employees) {
      const permissionRecord = await UserPermission.findOne({
        userId: employee._id,
      });

      if (permissionRecord) {
        // Check nếu có view_statistics
        const hasViewStats =
          permissionRecord.permissions.includes("view_statistics");

        if (hasViewStats) {
          // Remove view_statistics
          permissionRecord.permissions = permissionRecord.permissions.filter(
            (perm) => perm !== "view_statistics"
          );

          await permissionRecord.save();
          removedCount++;

          console.log(`✅ Removed view_statistics from ${employee.email}`);
        } else {
          console.log(
            `⚪ ${employee.email} already doesn't have view_statistics`
          );
        }
      } else {
        console.log(`❌ No permission record found for ${employee.email}`);
      }
    }

    console.log(`\n🎯 Summary:`);
    console.log(`   - Total employees: ${employees.length}`);
    console.log(`   - Removed view_statistics from: ${removedCount} employees`);
    console.log(`   - Now ALL employees should NOT have view_statistics`);

    // Verify kết quả
    console.log(`\n🔍 Verification:`);
    for (const employee of employees) {
      const permissionRecord = await UserPermission.findOne({
        userId: employee._id,
      });
      const hasViewStats =
        permissionRecord?.permissions.includes("view_statistics") || false;
      console.log(
        `   ${employee.email}: ${
          hasViewStats ? "❌ STILL HAS" : "✅ NO ACCESS"
        }`
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

removeStatisticsPermissionFromAllEmployees();
