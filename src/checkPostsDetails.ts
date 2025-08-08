import { connect } from "mongoose";
import { Post } from "./models/Post";

(async () => {
  try {
    await connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    // Kiểm tra cấu trúc một vài document để hiểu rõ hơn
    const samplePosts = await Post.find().limit(5).lean();
    console.log("\nSample posts:");
    samplePosts.forEach((post, index) => {
      console.log(`\nPost ${index + 1}:`);
      console.log(`- ID: ${post._id}`);
      console.log(`- Title: ${post.title}`);
      console.log(`- Package ID: ${post.packageId || "No package"}`);
      // Hiển thị các field khác liên quan đến gói
      console.log(`- Package Duration: ${post.packageDuration || "N/A"}`);
      console.log(`- Created At: ${post.createdAt}`);
      console.log(`- Updated At: ${post.updatedAt}`);
    });

    // Kiểm tra xem những posts có packageId là chuỗi 'free', 'vip', 'basic', 'premium'
    // có thực sự là ID tham chiếu đến collection packages hay không
    const postWithStringPackageId = await Post.findOne({
      packageId: { $in: ["free", "vip", "basic", "premium"] },
    }).lean();

    if (postWithStringPackageId) {
      console.log("\nFound post with string packageId:");
      console.log(`- ID: ${postWithStringPackageId._id}`);
      console.log(`- Title: ${postWithStringPackageId.title}`);
      console.log(`- Package ID: ${postWithStringPackageId.packageId}`);
    } else {
      console.log(
        "\nNo posts found with string packageId matching free/vip/basic/premium"
      );
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
