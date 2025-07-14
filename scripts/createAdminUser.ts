/**
 * Script to create admin user for testing notification system
 */

import { User } from "../src/models/User";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

async function connectDB() {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

async function createAdminUser() {
  console.log("🔧 Creating admin user for testing...");

  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@notification.test",
    });
    if (existingAdmin) {
      console.log("✅ Admin user already exists: admin@notification.test");
      return existingAdmin;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("adminpassword", 10);

    // Create admin user
    const adminUser = new User({
      username: "Admin Notification",
      email: "admin@notification.test",
      password: hashedPassword,
      role: "admin",
      emailVerified: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@notification.test");
    console.log("🔑 Password: adminpassword");
    console.log("👤 Role: admin");

    return adminUser;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
}

async function main() {
  console.log("🚀 Creating admin user for notification testing...");

  await connectDB();
  await createAdminUser();

  console.log("\n🎉 Setup completed!");
  console.log("📋 Next steps:");
  console.log("1. Go to http://localhost:3001/dang-nhap");
  console.log("2. Login with admin@notification.test / adminpassword");
  console.log("3. Navigate to http://localhost:3001/admin/quan-ly-thong-bao");
  console.log("4. Test creating and managing notifications");

  process.exit(0);
}

// Handle errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error);
  process.exit(1);
});
