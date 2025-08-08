#!/usr/bin/env node

/**
 * Script để kiểm tra menu items trong sidebar hiện tại
 */

import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Import models
import SidebarConfig from "../src/models/SidebarConfig";

async function connectDb() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  }
}

async function listAllMenuItems() {
  try {
    console.log("📋 LISTING ALL SIDEBAR MENU ITEMS:\n");

    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    if (!sidebarConfig) {
      console.log("❌ No sidebar config found");
      return;
    }

    console.log(`📋 Sidebar Config: ${sidebarConfig.name}`);
    console.log(`📊 Total items: ${sidebarConfig.items.length}\n`);

    sidebarConfig.items.forEach((item: any, index: number) => {
      const permissions = item.metadata?.permissions || [];
      console.log(
        `${(index + 1).toString().padStart(2, "0")}. ${item.id.padEnd(
          20
        )} → ${item.title.padEnd(25)} → [${permissions.join(", ")}]`
      );
    });

    console.log(`\n🔍 LOOKING FOR THONG-KE/STATS RELATED MENUS:`);
    const statsMenus = sidebarConfig.items.filter(
      (item: any) =>
        item.id.includes("stats") ||
        item.id.includes("thong-ke") ||
        item.title.toLowerCase().includes("thống kê") ||
        item.path.includes("thong-ke")
    );

    if (statsMenus.length > 0) {
      statsMenus.forEach((item: any) => {
        const permissions = item.metadata?.permissions || [];
        console.log(
          `   📊 ${item.id} → "${item.title}" → [${permissions.join(", ")}]`
        );
      });
    } else {
      console.log(`   ❌ Không tìm thấy menu nào liên quan đến thống kê`);
    }
  } catch (error) {
    console.error("❌ Error listing menu items:", error);
  }
}

async function main() {
  try {
    await connectDb();
    await listAllMenuItems();
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log(`\n✅ Disconnected from MongoDB`);
  }
}

// Chạy script
main();
