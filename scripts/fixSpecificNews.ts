import mongoose from "mongoose";
import { News } from "../src/models/News";
import { User } from "../src/models/User";

async function fixSpecificNews() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    // Find admin user
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("No admin user found");
      return;
    }

    console.log(`Found admin user: ${adminUser.username} (${adminUser._id})`);

    // Update specific news with correct author and published status
    const newsId = "687a1dcaf90ffe1e93a0f8f8";

    const updatedNews = await News.findByIdAndUpdate(
      newsId,
      {
        author: adminUser._id,
        status: "published",
        publishedAt: new Date(),
      },
      { new: true }
    ).populate("author");

    if (updatedNews) {
      console.log("\n=== UPDATED NEWS ===");
      console.log(`Title: ${updatedNews.title}`);
      console.log(`Author: ${(updatedNews.author as any)?.username}`);
      console.log(`Status: ${updatedNews.status}`);
      console.log(`Published At: ${updatedNews.publishedAt}`);
    } else {
      console.log("News not found");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

fixSpecificNews();
