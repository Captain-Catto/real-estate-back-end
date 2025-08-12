const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/realestate");
    console.log("Connected to database");

    const { User, Notification } = require("./src/models");

    // Get all users
    const allUsers = await User.find({}).limit(20);
    console.log("\n📋 All users in database:");
    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user._id} - Email: ${user.email} - Name: ${
          user.name
        } - Role: ${user.role}`
      );
    });

    // Get recent notifications with their userIds
    console.log("\n📨 Recent notifications:");
    const recentNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    const uniqueUserIds = new Set();
    recentNotifications.forEach((notification, index) => {
      console.log(
        `${index + 1}. ${notification.title} - User ID: ${
          notification.userId
        } - ${notification.createdAt}`
      );
      uniqueUserIds.add(notification.userId.toString());
    });

    console.log("\n🔍 Unique user IDs from notifications:");
    uniqueUserIds.forEach((userId) => {
      console.log(`- ${userId}`);
    });

    // Check if any notification user exists in actual user collection
    console.log("\n✅ Checking if notification users exist:");
    for (const userId of uniqueUserIds) {
      try {
        const user = await User.findById(userId);
        console.log(
          `User ${userId}: ${user ? `Found - ${user.email}` : "NOT FOUND"}`
        );
      } catch (e) {
        console.log(`User ${userId}: Error - ${e.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

connectDB();
