const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/realestate");
    console.log("Connected to database");

    const { User, Payment, Notification } = require("./src/models");

    // Find all users first
    const allUsers = await User.find({}).limit(10);
    console.log("\n📋 Sample users in database:");
    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ID: ${user._id} - Email: ${user.email} - Name: ${
          user.name
        }`
      );
    });

    // Try converting string IDs to ObjectId
    const ObjectId = mongoose.Types.ObjectId;

    let user1, user2;

    try {
      user1 = await User.findById(new ObjectId("68983bbbca6c4849877f7873"));
    } catch (e) {
      console.log("User 1 ID is not a valid ObjectId:", e.message);
    }

    try {
      user2 = await User.findById(new ObjectId("686cc6b72e3ab0fe8c6fcc25"));
    } catch (e) {
      console.log("User 2 ID is not a valid ObjectId:", e.message);
    }

    if (user1) {
      console.log("✅ Found user 1:", { id: user1._id, email: user1.email });
    } else {
      console.log("❌ User 1 not found");
    }

    if (user2) {
      console.log("✅ Found user 2:", { id: user2._id, email: user2.email });
    } else {
      console.log("❌ User 2 not found");
    }

    // Check recent notifications to see which users they belong to
    console.log("\n📨 Recent notifications and their users:");
    const recentNotifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(10);

    for (const notification of recentNotifications) {
      const user = await User.findById(notification.userId);
      console.log(
        `Notification: ${notification.title} - User: ${
          notification.userId
        } - User exists: ${!!user}`
      );
      if (user) {
        console.log(`  User email: ${user.email}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

connectDB();
