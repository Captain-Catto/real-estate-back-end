import mongoose from "mongoose";
import { NotificationService } from "../src/services/NotificationService";

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("✅ Connected to MongoDB");

    // Test user ID (replace with actual user ID from your database)
    const testUserId = "60a5f1c5e1b5d5d5d5d5d5d5"; // Example ObjectId

    console.log("\n🧪 Testing Notifications...\n");

    // 1. Test Top-up Success Notification
    console.log("1. Testing Top-up Success Notification...");
    await NotificationService.createTopUpSuccessNotification(
      testUserId,
      500000,
      "ORDER_" + Date.now()
    );
    console.log("✅ Top-up notification sent\n");

    // 2. Test Package Purchase Notification
    console.log("2. Testing Package Purchase Notification...");
    await NotificationService.createPackagePurchaseNotification(
      testUserId,
      "Gói VIP 30 ngày",
      300000,
      "ORDER_" + Date.now(),
      30
    );
    console.log("✅ Package purchase notification sent\n");

    // 3. Test Post Approved Notification
    console.log("3. Testing Post Approved Notification...");
    await NotificationService.createPostApprovedNotification(
      testUserId,
      "Bán căn hộ chung cư Vinhomes Central Park",
      "60a5f1c5e1b5d5d5d5d5d5d6"
    );
    console.log("✅ Post approved notification sent\n");

    // 4. Test Post Rejected Notification
    console.log("4. Testing Post Rejected Notification...");
    await NotificationService.createPostRejectedNotification(
      testUserId,
      "Cho thuê nhà nguyên căn Q1",
      "60a5f1c5e1b5d5d5d5d5d5d7",
      "Thiếu thông tin giá và hình ảnh"
    );
    console.log("✅ Post rejected notification sent\n");

    // 5. Test Interest Notification
    console.log("5. Testing Interest Notification...");
    await NotificationService.createInterestNotification(
      testUserId,
      "Bán biệt thự Thảo Điền",
      "60a5f1c5e1b5d5d5d5d5d5d8",
      "Nguyễn Văn A"
    );
    console.log("✅ Interest notification sent\n");

    // 6. Test System Notification
    console.log("6. Testing System Notification...");
    await NotificationService.createSystemNotification(
      testUserId,
      "🎉 Chào mừng bạn đến với hệ thống",
      "Chúc mừng bạn đã đăng ký thành công! Hãy khám phá các tính năng tuyệt vời của chúng tôi.",
      {
        actionButton: {
          text: "Bắt đầu khám phá",
          link: "/nguoi-dung/dashboard",
          style: "primary",
        },
      }
    );
    console.log("✅ System notification sent\n");

    console.log("🎉 All test notifications have been sent successfully!");
    console.log("\n📋 Action Button Examples:");
    console.log("- Top-up: 'Xem ví' -> /tai-khoan/vi-tien (style: primary)");
    console.log(
      "- Package: 'Đăng tin ngay' -> /nguoi-dung/dang-tin (style: success)"
    );
    console.log(
      "- Approved: 'Xem tin đăng' -> /tin-dang/{postId} (style: primary)"
    );
    console.log(
      "- Rejected: 'Chỉnh sửa tin' -> /nguoi-dung/tin-dang/chinh-sua/{postId} (style: warning)"
    );
    console.log(
      "- Interest: 'Xem tin đăng' -> /tin-dang/{postId} (style: info)"
    );
    console.log(
      "- System: 'Bắt đầu khám phá' -> /nguoi-dung/dashboard (style: primary)"
    );
  } catch (error) {
    console.error("❌ Error testing notifications:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  }
}

// Run the test
testNotifications();
