/**
 * Script to test the notification system
 * Run this with: npm run ts-node scripts/testNotificationSystem.ts
 */

import { NotificationService } from "../src/services/NotificationService";
import { Notification } from "../src/models/Notification";
import { User } from "../src/models/User";
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

async function testSystemNotification() {
  console.log("\n🧪 Testing System Notification...");

  try {
    // Find a test user
    const testUser = await User.findOne({ role: "user" }).limit(1);
    if (!testUser) {
      console.log("❌ No test user found. Please create a user first.");
      return;
    }

    console.log(`📧 Sending test notification to user: ${testUser.email}`);

    // Create a system notification
    await NotificationService.createSystemNotification(
      testUser._id.toString(),
      "🎉 Thông báo hệ thống",
      "Đây là thông báo hệ thống thử nghiệm từ admin. Hệ thống thông báo đã hoạt động tốt!",
      {
        actionButton: {
          text: "Xem chi tiết",
          link: "/tin-tuc",
          style: "primary",
        },
      }
    );

    console.log("✅ System notification created successfully!");

    // Check if notification was created
    const notification = await Notification.findOne({
      userId: testUser._id,
      type: "SYSTEM",
    }).sort({ createdAt: -1 });

    if (notification) {
      console.log("✅ Notification found in database:");
      console.log({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        actionButton: notification.data.actionButton,
      });
    } else {
      console.log("❌ Notification not found in database");
    }
  } catch (error) {
    console.error("❌ Error testing system notification:", error);
  }
}

async function testTopUpNotification() {
  console.log("\n💰 Testing Top-up Notification...");

  try {
    // Find a test user
    const testUser = await User.findOne({ role: "user" }).limit(1);
    if (!testUser) {
      console.log("❌ No test user found. Please create a user first.");
      return;
    }

    console.log(
      `💰 Sending test top-up notification to user: ${testUser.email}`
    );

    // Create a top-up notification
    await NotificationService.createTopUpSuccessNotification(
      testUser._id.toString(),
      50000,
      "TEST123456"
    );

    console.log("✅ Top-up notification created successfully!");

    // Check if notification was created
    const notification = await Notification.findOne({
      userId: testUser._id,
      type: "PAYMENT",
    }).sort({ createdAt: -1 });

    if (notification) {
      console.log("✅ Top-up notification found in database:");
      console.log({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        orderId: notification.data.orderId,
        amount: notification.data.amount,
      });
    } else {
      console.log("❌ Top-up notification not found in database");
    }
  } catch (error) {
    console.error("❌ Error testing top-up notification:", error);
  }
}

async function testPostApprovalNotification() {
  console.log("\n✅ Testing Post Approval Notification...");

  try {
    // Find a test user
    const testUser = await User.findOne({ role: "user" }).limit(1);
    if (!testUser) {
      console.log("❌ No test user found. Please create a user first.");
      return;
    }

    console.log(
      `✅ Sending test post approval notification to user: ${testUser.email}`
    );

    // Create a post approval notification
    await NotificationService.createPostApprovedNotification(
      testUser._id.toString(),
      "670c2f78a1aa19e145d71e5", // fake post ID for testing
      "Căn hộ cao cấp quận 7"
    );

    console.log("✅ Post approval notification created successfully!");

    // Check if notification was created
    const notification = await Notification.findOne({
      userId: testUser._id,
      type: "POST_APPROVED",
    }).sort({ createdAt: -1 });

    if (notification) {
      console.log("✅ Post approval notification found in database:");
      console.log({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        postId: notification.data.postId,
        postTitle: notification.data.postTitle,
        actionButton: notification.data.actionButton,
      });
    } else {
      console.log("❌ Post approval notification not found in database");
    }
  } catch (error) {
    console.error("❌ Error testing post approval notification:", error);
  }
}

async function getNotificationStats() {
  console.log("\n📊 Getting Notification Stats...");

  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ["$read", false] }, 1, 0] },
          },
          readCount: {
            $sum: { $cond: [{ $eq: ["$read", true] }, 1, 0] },
          },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log("📊 Notification Statistics:");
    stats.forEach((stat) => {
      console.log(
        `  ${stat._id}: ${stat.count} total (${stat.unreadCount} unread, ${stat.readCount} read)`
      );
    });

    const totalNotifications = await Notification.countDocuments();
    console.log(`\n📈 Total notifications in system: ${totalNotifications}`);
  } catch (error) {
    console.error("❌ Error getting notification stats:", error);
  }
}

async function main() {
  console.log("🚀 Starting Notification System Test...");

  await connectDB();

  await testSystemNotification();
  await testTopUpNotification();
  await testPostApprovalNotification();
  await getNotificationStats();

  console.log("\n✅ All tests completed!");
  process.exit(0);
}

// Handle errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled rejection:", err);
  process.exit(1);
});

// Run the test
main().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
