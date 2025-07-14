import mongoose from "mongoose";
import { Package } from "../src/models/Package";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Default packages data
const defaultPackages = [
  {
    id: "free",
    name: "Gói Miễn Phí",
    price: 0,
    duration: 7,
    features: [
      "Hiển thị tin đăng 7 ngày",
      "Xuất hiện trong kết quả tìm kiếm",
      "Hỗ trợ khách hàng cơ bản",
    ],
    priority: "normal",
    description: "Gói miễn phí cho người dùng mới",
    canPin: false,
    canHighlight: false,
    canUseAI: false,
    supportLevel: "basic",
    displayOrder: 1,
    isPopular: false,
    discountPercentage: 0,
    isActive: true,
  },
  {
    id: "basic",
    name: "Gói Cơ Bản",
    price: 50000,
    duration: 30,
    features: [
      "Hiển thị tin đăng 30 ngày",
      "Xuất hiện trong kết quả tìm kiếm",
      "Hỗ trợ khách hàng cơ bản",
      "Đăng tin cơ bản",
      "Hỗ trợ email",
    ],
    priority: "normal",
    description: "Gói cơ bản phù hợp cho người dùng thường xuyên",
    canPin: false,
    canHighlight: false,
    canUseAI: false,
    supportLevel: "basic",
    displayOrder: 2,
    isPopular: false,
    discountPercentage: 0,
    isActive: true,
  },
  {
    id: "premium",
    name: "Gói Cao Cấp",
    price: 150000,
    duration: 30,
    features: [
      "Hiển thị tin đăng 30 ngày",
      "Ưu tiên trong kết quả tìm kiếm",
      "Xuất hiện trang chủ",
      "Hỗ trợ khách hàng ưu tiên",
      "Thống kê chi tiết",
      "Có thể ghim bài",
      "Làm nổi bật tin đăng",
      "Hỗ trợ chat trực tiếp",
    ],
    priority: "premium",
    description: "Gói cao cấp với nhiều tính năng nâng cao",
    canPin: true,
    canHighlight: true,
    canUseAI: false,
    supportLevel: "standard",
    displayOrder: 3,
    isPopular: true,
    discountPercentage: 0,
    isActive: true,
  },
  {
    id: "vip",
    name: "Gói VIP",
    price: 300000,
    duration: 30,
    features: [
      "Hiển thị tin đăng 30 ngày",
      "Luôn xuất hiện đầu trang",
      "Nổi bật với nhãn VIP",
      "Xuất hiện nhiều vị trí",
      "Hỗ trợ 24/7",
      "Báo cáo chi tiết",
      "Tư vấn marketing",
      "Sử dụng AI hỗ trợ",
      "Ghim bài và làm nổi bật",
      "Hỗ trợ cá nhân hóa",
    ],
    priority: "vip",
    description: "Gói VIP với đầy đủ tính năng cao cấp nhất",
    canPin: true,
    canHighlight: true,
    canUseAI: true,
    supportLevel: "premium",
    displayOrder: 4,
    isPopular: false,
    discountPercentage: 0,
    isActive: true,
  },
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Seed packages function
const seedPackages = async () => {
  try {
    console.log("🌱 Starting to seed packages...");

    // Delete all existing packages
    await Package.deleteMany({});
    console.log("✅ Deleted all existing packages");

    // Insert default packages
    await Package.insertMany(defaultPackages);
    console.log(`✅ Added ${defaultPackages.length} default packages`);

    // Check results
    const totalPackages = await Package.countDocuments();
    const activePackages = await Package.countDocuments({ isActive: true });
    const popularPackages = await Package.countDocuments({ isPopular: true });

    console.log(`📊 Seeding completed:`);
    console.log(`   - Total packages: ${totalPackages}`);
    console.log(`   - Active packages: ${activePackages}`);
    console.log(`   - Popular packages: ${popularPackages}`);

    // List all packages
    const packages = await Package.find({}).sort({ displayOrder: 1 });
    console.log("\n📦 Packages created:");
    packages.forEach((pkg) => {
      console.log(
        `   - ${pkg.name} (${pkg.id}): ${pkg.price.toLocaleString()}đ - ${
          pkg.duration
        } days`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding packages:", error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await seedPackages();
  await mongoose.disconnect();
  console.log("✅ Disconnected from MongoDB");
  process.exit(0);
};

// Run the script
main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});
