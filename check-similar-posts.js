const mongoose = require("mongoose");
require("dotenv").config();

async function checkSimilarPosts() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    const Post = mongoose.model(
      "Post",
      new mongoose.Schema({}, { strict: false })
    );

    // Lấy một bài đăng mẫu để kiểm tra (chọn bài đăng active)
    const samplePost = await Post.findOne({ status: "active" }).lean();
    if (samplePost) {
      console.log("\n=== Sample post structure ===");
      console.log("ID:", samplePost._id);
      console.log("Title:", samplePost.title);
      console.log("Project:", samplePost.project);
      console.log("Location:", JSON.stringify(samplePost.location, null, 2));
      console.log("Category:", samplePost.category);
      console.log("Type:", samplePost.type);
      console.log("Status:", samplePost.status);

      console.log("\n=== Checking similar post counts ===");

      // Đếm số bài đăng có cùng project
      if (samplePost.project) {
        const sameProjectCount = await Post.countDocuments({
          project: samplePost.project,
          _id: { $ne: samplePost._id },
          status: "active",
        });
        console.log("Posts with same project:", sameProjectCount);
      }

      // Đếm số bài đăng có cùng ward
      if (samplePost.location?.ward) {
        const sameWardCount = await Post.countDocuments({
          "location.ward": samplePost.location.ward,
          _id: { $ne: samplePost._id },
          status: "active",
          project: null,
        });
        console.log("Posts with same ward (no project):", sameWardCount);
      }

      // Đếm số bài đăng có cùng category
      const sameCategoryCount = await Post.countDocuments({
        category: samplePost.category,
        type: samplePost.type,
        _id: { $ne: samplePost._id },
        status: "active",
      });
      console.log("Posts with same category+type:", sameCategoryCount);

      // Kiểm tra tổng số bài đăng active
      const totalActivePosts = await Post.countDocuments({ status: "active" });
      console.log("Total active posts:", totalActivePosts);

      // Kiểm tra location structure của các bài đăng khác
      console.log("\n=== Checking other posts location structures ===");
      const otherPosts = await Post.find({ _id: { $ne: samplePost._id } })
        .limit(3)
        .select("title location project")
        .lean();

      otherPosts.forEach((post, index) => {
        console.log(`Post ${index + 1}:`, post.title);
        console.log("  Location:", JSON.stringify(post.location));
        console.log("  Project:", post.project);
      });
    }

    await mongoose.connection.close();
    console.log("\nDone!");
  } catch (error) {
    console.error("Error:", error);
  }
}

checkSimilarPosts();
