/**
 * Simple notification test script - Creates test user if needed
 * Run: npm run test-notifications-simple
 */

import mongoose from "mongoose";
import { NotificationService } from "../src/services/NotificationService";
import { Notification } from "../src/models/Notification";
import { User } from "../src/models/User";
import bcrypt from "bcrypt";

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

async function createTestUser() {
  console.log("👤 Creating test user...");

  try {
    // Check if test user already exists
    let testUser = await User.findOne({ email: "testuser@notification.test" });

    if (testUser) {
      console.log("✅ Test user already exists:", testUser.email);
      return testUser;
    }

    // Create new test user
    const hashedPassword = await bcrypt.hash("testpassword", 10);

    testUser = new User({
      username: "Test User",
      email: "testuser@notification.test",
      password: hashedPassword,
      role: "user",
      phoneNumber: "0123456789",
    });

    await testUser.save();
    console.log("✅ Test user created:", testUser.email);
    return testUser;
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    throw error;
  }
}

async function testAllNotificationTypes(userId: string) {
  console.log("\n🧪 Testing all notification types...\n");

  try {
    // 1. System Notification
    console.log("1. 🔔 Testing System Notification...");
    await NotificationService.createSystemNotification(
      userId,
      "🎉 Chào mừng đến với hệ thống!",
      "Đây là thông báo hệ thống test. Chúc mừng bạn đã tham gia!",
      {
        actionButton: {
          text: "Khám phá ngay",
          link: "/nguoi-dung/dashboard",
          style: "primary",
        },
      }
    );
    console.log("✅ System notification created\n");

    // 2. Top-up Notification
    console.log("2. 💰 Testing Top-up Notification...");
    await NotificationService.createTopUpSuccessNotification(
      userId,
      100000,
      "TEST_ORDER_" + Date.now()
    );
    console.log("✅ Top-up notification created\n");

    // 3. Package Purchase Notification
    console.log("3. 🎉 Testing Package Purchase Notification...");
    await NotificationService.createPackagePurchaseNotification(
      userId,
      "Gói VIP 30 ngày",
      50000,
      "PKG_ORDER_" + Date.now(),
      30
    );
    console.log("✅ Package purchase notification created\n");

    // 4. Post Approved Notification
    console.log("4. ✅ Testing Post Approved Notification...");
    await NotificationService.createPostApprovedNotification(
      userId,
      "TEST_POST_" + Date.now(),
      "Căn hộ cao cấp test"
    );
    console.log("✅ Post approved notification created\n");

    // 5. Post Rejected Notification
    console.log("5. ❌ Testing Post Rejected Notification...");
    await NotificationService.createPostRejectedNotification(
      userId,
      "TEST_POST_REJECT_" + Date.now(),
      "Bài viết test bị từ chối",
      "Thiếu thông tin mô tả chi tiết"
    );
    console.log("✅ Post rejected notification created\n");

    // 6. Interest Notification
    console.log("6. 💖 Testing Interest Notification...");
    await NotificationService.createInterestNotification(
      userId,
      "Nhà phố cao cấp test",
      "TEST_POST_INTEREST_" + Date.now(),
      "Khách hàng Test"
    );
    console.log("✅ Interest notification created\n");
  } catch (error) {
    console.error("❌ Error testing notifications:", error);
    throw error;
  }
}

async function getNotificationSummary(userId: string) {
  console.log("📊 Getting notification summary...\n");

  try {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    console.log(
      `📈 Total notifications for test user: ${notifications.length}`
    );

    const typeCount = await Notification.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n📊 Notifications by type:");
    typeCount.forEach((item) => {
      const icon = getTypeIcon(item._id);
      console.log(`  ${icon} ${item._id}: ${item.count}`);
    });

    console.log("\n📋 Latest 3 notifications:");
    notifications.slice(0, 3).forEach((notif, index) => {
      const icon = getTypeIcon(notif.type);
      console.log(`  ${index + 1}. ${icon} ${notif.title}`);
      if (notif.data.actionButton) {
        console.log(
          `     → ${notif.data.actionButton.text} (${notif.data.actionButton.link})`
        );
      }
    });
  } catch (error) {
    console.error("❌ Error getting notification summary:", error);
  }
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "SYSTEM":
      return "🔔";
    case "PAYMENT":
      return "💰";
    case "PACKAGE_PURCHASE":
      return "🎉";
    case "POST_APPROVED":
      return "✅";
    case "POST_REJECTED":
      return "❌";
    case "INTEREST":
      return "💖";
    default:
      return "📢";
  }
}

async function cleanup() {
  console.log("\n🧹 Cleanup (optional)...");

  try {
    // Ask if user wants to cleanup test data
    const testUser = await User.findOne({
      email: "testuser@notification.test",
    });
    if (testUser) {
      // Just show stats, don't actually delete
      const notificationCount = await Notification.countDocuments({
        userId: testUser._id,
      });
      console.log(`ℹ️  Test user has ${notificationCount} notifications`);
      console.log(
        "ℹ️  To cleanup: delete user 'testuser@notification.test' from admin panel"
      );
    }
  } catch (error) {
    console.error("❌ Error in cleanup:", error);
  }
}

async function main() {
  console.log("🚀 Starting Simple Notification Test...\n");

  try {
    await connectDB();

    // Create or find test user
    const testUser = await createTestUser();

    // Test all notification types
    await testAllNotificationTypes(testUser._id.toString());

    // Show summary
    await getNotificationSummary(testUser._id.toString());

    // Cleanup info
    await cleanup();

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📱 Next steps:");
    console.log(
      "1. Login to frontend with testuser@notification.test / testpassword"
    );
    console.log("2. Check notifications in the header bell icon");
    console.log("3. Test action buttons by clicking them");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    process.exit(0);
  }
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
