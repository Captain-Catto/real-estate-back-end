const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGO_URI || "mongodb://localhost:27017/real-estate"
);

// Define notification schema (simplified)
const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  userId: String,
  data: {
    actionButton: {
      text: String,
      link: String,
      style: String,
    },
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

async function testNotificationData() {
  try {
    console.log("🔍 Checking existing notifications...");

    // Get a few recent notifications
    const notifications = await Notification.find()
      .limit(5)
      .sort({ createdAt: -1 });

    console.log(`Found ${notifications.length} notifications`);

    notifications.forEach((notif, index) => {
      console.log(`\n📧 Notification ${index + 1}:`);
      console.log(`  Title: ${notif.title}`);
      console.log(`  Type: ${notif.type}`);
      console.log(`  Data:`, notif.data);
      console.log(`  Action Button:`, notif.data?.actionButton);
      console.log(`  Link:`, notif.data?.actionButton?.link);
    });

    // Create a test notification with link if none exist
    if (
      notifications.length === 0 ||
      !notifications.some((n) => n.data?.actionButton?.link)
    ) {
      console.log("\n🚀 Creating test notification with navigation link...");

      const testNotification = new Notification({
        title: "Test Navigation Notification",
        message: "Click to test navigation to property listing",
        type: "SYSTEM",
        userId: "test-user-id",
        data: {
          actionButton: {
            text: "Xem chi tiết",
            link: "/bat-dong-san",
            style: "primary",
          },
        },
      });

      await testNotification.save();
      console.log("✅ Test notification created successfully");
      console.log("Link:", testNotification.data.actionButton.link);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    mongoose.connection.close();
  }
}

testNotificationData();
