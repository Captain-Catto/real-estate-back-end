#!/usr/bin/env node

import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { User } from "../src/models/User";
import UserPermission from "../src/models/UserPermission";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
const API_URL = "http://localhost:8080/api/admin/stats";

async function connectDb() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

async function testStatsAPIDirectly() {
  try {
    console.log("🧪 Testing Stats API Directly...\n");

    // Lấy một employee
    const employee = await User.findOne({ role: "employee" });
    if (!employee) {
      console.log("❌ No employee found");
      return;
    }

    console.log(`👤 Testing with: ${employee.username}`);

    // Kiểm tra permissions
    const permissions = await UserPermission.findOne({ userId: employee._id });
    const hasStats =
      permissions?.permissions.includes("view_statistics") || false;
    console.log(`🔐 Has view_statistics: ${hasStats ? "✅" : "❌"}`);

    if (!hasStats) {
      console.log("❌ Employee doesn't have view_statistics permission");
      return;
    }

    // Tạo token
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

    console.log("🔑 Generated test token\n");

    // Test các API endpoints
    const endpoints = [
      "/overview",
      "/revenue-chart?period=month",
      "/posts-chart",
      "/property-types-chart",
      "/top-locations",
      "/user-chart?period=month",
    ];

    console.log("🚀 Testing API endpoints:");
    console.log("=".repeat(50));

    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing: ${API_URL}${endpoint}`);

        const response = await fetch(`${API_URL}${endpoint}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          console.log(`   ✅ SUCCESS`);
        } else {
          const errorData = await response.text();
          console.log(`   ❌ FAILED: ${errorData}`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
      }

      console.log("");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  }
}

connectDb().then(() => {
  testStatsAPIDirectly();
});
