const mongoose = require("mongoose");
const { Notification } = require("./src/models/Notification");

async function checkNotifications() {
  try {
    await mongoose.connect("mongodb://localhost:27017/real-estate");
    console.log("Connected to database");

    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId("68983bbbca6c4849877f7873"),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("Recent notifications for user 68983bbbca6c4849877f7873:");
    if (notifications.length === 0) {
      console.log("No notifications found");
    } else {
      notifications.forEach((n) => {
        console.log(
          "- " +
            n.title +
            " (" +
            n.type +
            ") - " +
            n.createdAt +
            " - Read: " +
            n.read
        );
      });
    }

    // Also check latest notifications for any user
    const allRecent = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log("\nLatest 5 notifications in system:");
    allRecent.forEach((n) => {
      console.log(
        "- User: " +
          n.userId +
          " - " +
          n.title +
          " (" +
          n.type +
          ") - " +
          n.createdAt
      );
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkNotifications();
