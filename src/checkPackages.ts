import { connect } from "mongoose";
import { Post } from "./models/Post";
import { Package } from "./models/Package";

(async () => {
  try {
    await connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    // Đếm tổng số posts
    const totalPosts = await Post.countDocuments();
    console.log(`Total posts: ${totalPosts}`);

    // Đếm số lượng posts không có packageId
    const freePosts = await Post.countDocuments({
      $or: [
        { packageId: { $exists: false } },
        { packageId: null },
        { packageId: "" },
      ],
    });
    console.log(`Posts without package (free): ${freePosts}`);

    // Đếm số lượng posts có packageId
    const paidPosts = await Post.countDocuments({
      packageId: { $exists: true, $nin: [null, ""] },
    });
    console.log(`Posts with package (paid): ${paidPosts}`);

    // Phân bố theo packageId
    const packageDistribution = await Post.aggregate([
      {
        $match: {
          packageId: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $group: {
          _id: "$packageId",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    console.log("Package distribution:");
    console.log(JSON.stringify(packageDistribution, null, 2));

    // Xem chi tiết của các gói phổ biến nhất
    if (packageDistribution.length > 0) {
      const topPackageIds = packageDistribution.slice(0, 5).map((p) => p._id);

      console.log("\nDetails of top packages:");
      for (const id of topPackageIds) {
        try {
          const packageDetails = await Package.findById(id);
          console.log(
            `Package ${id}: ${JSON.stringify(packageDetails, null, 2)}`
          );
        } catch (err) {
          console.log(`Could not find package with id ${id}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
