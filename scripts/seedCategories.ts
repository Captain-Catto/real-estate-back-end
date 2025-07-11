import mongoose from "mongoose";
import { Category } from "../src/models/Category";

// Kết nối database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

// Danh sách categories mặc định
const defaultCategories = [
  // Categories cho bất động sản (isProject: false)
  {
    id: "cat_apartment",
    name: "Căn hộ chung cư",
    slug: "can-ho-chung-cu",
    isProject: false,
    order: 1,
    isActive: true,
    description: "Căn hộ, chung cư mini, penthouse",
  },
  {
    id: "cat_house",
    name: "Nhà riêng",
    slug: "nha-rieng",
    isProject: false,
    order: 2,
    isActive: true,
    description: "Nhà phố, biệt thự, liền kề",
  },
  {
    id: "cat_land",
    name: "Đất",
    slug: "dat",
    isProject: false,
    order: 3,
    isActive: true,
    description: "Đất nền, đất thổ cư, đất nông nghiệp",
  },
  {
    id: "cat_commercial",
    name: "Bất động sản thương mại",
    slug: "bat-dong-san-thuong-mai",
    isProject: false,
    order: 4,
    isActive: true,
    description: "Cửa hàng, văn phòng, nhà xưởng",
  },
  {
    id: "cat_room",
    name: "Phòng trọ",
    slug: "phong-tro",
    isProject: false,
    order: 5,
    isActive: true,
    description: "Phòng trọ, nhà trọ, ký túc xá",
  },

  // Categories cho dự án (isProject: true)
  {
    id: "cat_project_apartment",
    name: "Dự án căn hộ",
    slug: "du-an-can-ho",
    isProject: true,
    order: 1,
    isActive: true,
    description: "Dự án chung cư, căn hộ cao cấp",
  },
  {
    id: "cat_project_villa",
    name: "Dự án biệt thự",
    slug: "du-an-biet-thu",
    isProject: true,
    order: 2,
    isActive: true,
    description: "Dự án biệt thự, nhà phố cao cấp",
  },
  {
    id: "cat_project_land",
    name: "Dự án đất nền",
    slug: "du-an-dat-nen",
    isProject: true,
    order: 3,
    isActive: true,
    description: "Dự án khu đô thị, đất nền phân lô",
  },
  {
    id: "cat_project_mixed",
    name: "Dự án hỗn hợp",
    slug: "du-an-hon-hop",
    isProject: true,
    order: 4,
    isActive: true,
    description: "Dự án phức hợp, hỗn hợp nhiều loại hình",
  },
];

// Hàm seed categories
const seedCategories = async () => {
  try {
    console.log("🌱 Bắt đầu seed categories...");

    // Xóa tất cả categories hiện có
    await Category.deleteMany({});
    console.log("✅ Đã xóa tất cả categories cũ");

    // Thêm categories mặc định
    await Category.insertMany(defaultCategories);
    console.log(`✅ Đã thêm ${defaultCategories.length} categories mặc định`);

    // Kiểm tra kết quả
    const totalCategories = await Category.countDocuments();
    const propertyCategories = await Category.countDocuments({
      isProject: false,
    });
    const projectCategories = await Category.countDocuments({
      isProject: true,
    });

    console.log("📊 Thống kê:");
    console.log(`   - Tổng số categories: ${totalCategories}`);
    console.log(`   - Categories bất động sản: ${propertyCategories}`);
    console.log(`   - Categories dự án: ${projectCategories}`);

    console.log("🎉 Seed categories thành công!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi seed categories:", error);
    process.exit(1);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await seedCategories();
};

run();
