import mongoose from "mongoose";
import { News, User } from "../src/models";

async function checkCurrentNews() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    const news = await News.findById("687a1dcaf90ffe1e93a0f8f8").populate(
      "author"
    );
    console.log("=== NEWS DATA ===");
    console.log("ID:", news?._id);
    console.log("Title:", news?.title);
    console.log("Author populated:", news?.author);
    console.log("Featured Image:", news?.featuredImage);
    console.log("Status:", news?.status);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCurrentNews();
