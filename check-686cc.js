const mongoose = require("mongoose");
const { Notification } = require("./src/models/Notification");

async function checkNotifications() {
  try {
    await mongoose.connect("mongodb://localhost:27017/real-estate");
    console.log("Connected to database");

    // Check for current user (based on the logs, this seems to be the correct user)
    const notifications = await Notification.find({
      userId: new mongoose.Types.ObjectId("686cc6b72e3ab0fe8c6fcc25"),
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log("Recent notifications for user 686cc6b72e3ab0fe8c6fcc25:");
    if (notifications.length === 0) {
      console.log("No notifications found");
    } else {
      notifications.forEach((n, index) => {
        console.log(
          index +
            1 +
            ". " +
            n.title +
            " (" +
            n.type +
            ") - " +
            n.createdAt +
            " - Read: " +
            n.read +
            " - ID: " +
            n._id
        );
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkNotifications();
