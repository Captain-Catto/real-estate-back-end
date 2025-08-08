#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function debugAuthMiddleware() {
  try {
    console.log("🔍 Debug Authentication Middleware Issue...\n");

    // Lấy một employee để test
    const employee = await User.findOne({ role: "employee" });
    if (!employee) {
      console.log("❌ No employee found");
      return;
    }

    console.log(`👤 Testing with: ${employee.username} (${employee.email})`);
    console.log(`🆔 User ID: ${employee._id}\n`);

    // Kiểm tra permissions trong database
    const permissions = await UserPermission.findOne({ userId: employee._id });
    console.log("📋 Database permissions check:");
    console.log(`   - Permissions record exists: ${!!permissions}`);
    console.log(
      `   - Has view_statistics: ${
        permissions?.permissions.includes("view_statistics") || false
      }`
    );
    console.log(
      `   - Total permissions: ${permissions?.permissions.length || 0}\n`
    );

    // Tạo JWT token giống như hệ thống thực
    const tokenPayload = {
      userId: employee._id.toString(),
      email: employee.email,
      role: employee.role,
      username: employee.username,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1h" }
    );

    console.log("🔑 Generated JWT token for testing");
    console.log(`   Token payload:`, tokenPayload);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as any;
    console.log("\n🔓 Decoded token:");
    console.log(`   - userId: ${decoded.userId}`);
    console.log(`   - email: ${decoded.email}`);
    console.log(`   - role: ${decoded.role}\n`);

    // Simulate middleware permission check
    console.log("🔄 Simulating middleware permission check:");
    console.log("1. ✅ Token verified successfully");
    console.log(
      `2. ${
        decoded.role === "admin"
          ? "✅ Admin bypass"
          : "⚪ Not admin, checking permissions"
      }`
    );

    if (decoded.role !== "admin") {
      console.log("3. 🔍 Looking up user permissions...");

      const userPermission = await UserPermission.findOne({
        userId: decoded.userId,
      });

      console.log(
        `   - Query: UserPermission.findOne({ userId: "${decoded.userId}" })`
      );
      console.log(`   - Result: ${userPermission ? "Found" : "Not found"}`);

      if (userPermission) {
        const hasViewStats =
          userPermission.permissions.includes("view_statistics");
        console.log(
          `4. 📊 Checking view_statistics permission: ${
            hasViewStats ? "✅ GRANTED" : "❌ DENIED"
          }`
        );

        if (!hasViewStats) {
          console.log("❌ This would result in 403 Forbidden");
        } else {
          console.log("✅ Permission check would pass");
        }
      } else {
        console.log(
          "4. ❌ No permissions found - would result in 403 Forbidden"
        );
      }
    }

    // Check for potential issues
    console.log("\n🔍 Potential Issues Check:");

    // Issue 1: ObjectId vs string mismatch
    const userIdAsObjectId = employee._id;
    const userIdAsString = employee._id.toString();

    console.log(`   📝 User ID formats:`);
    console.log(`      - ObjectId: ${userIdAsObjectId}`);
    console.log(`      - String: ${userIdAsString}`);

    const permissionByObjectId = await UserPermission.findOne({
      userId: userIdAsObjectId,
    });
    const permissionByString = await UserPermission.findOne({
      userId: userIdAsString,
    });

    console.log(`   🔍 Permission lookup results:`);
    console.log(
      `      - By ObjectId: ${permissionByObjectId ? "Found" : "Not found"}`
    );
    console.log(
      `      - By String: ${permissionByString ? "Found" : "Not found"}`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

connectDb().then(() => {
  debugAuthMiddleware();
});
