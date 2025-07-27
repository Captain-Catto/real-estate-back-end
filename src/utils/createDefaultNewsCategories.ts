import mongoose from "mongoose";
import { NewsCategory } from "../models/NewsCategory";
import dotenv from "dotenv";

dotenv.config();

const defaultCategories = [
  {
    id: "news_cat_mua_ban",
    name: "Mua bán",
    slug: "mua-ban",
    description: "Tin tức về thị trường mua bán bất động sản",
    order: 1,
    isActive: true,
  },
  {
    id: "news_cat_cho_thue",
    name: "Cho thuê",
    slug: "cho-thue",
    description: "Tin tức về thị trường cho thuê bất động sản",
    order: 2,
    isActive: true,
  },
  {
    id: "news_cat_tai_chinh",
    name: "Tài chính",
    slug: "tai-chinh",
    description: "Tin tức về tài chính và đầu tư bất động sản",
    order: 3,
    isActive: true,
  },
  {
    id: "news_cat_phong_thuy",
    name: "Phong thủy",
    slug: "phong-thuy",
    description: "Tin tức về phong thủy trong bất động sản",
    order: 4,
    isActive: true,
  },
  {
    id: "news_cat_tong_hop",
    name: "Tổng hợp",
    slug: "tong-hop",
    description: "Tin tức tổng hợp về bất động sản",
    order: 5,
    isActive: true,
  },
];

async function createDefaultNewsCategories() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/my-backend-app"
    );

    console.log("Connected to MongoDB");

    // Kiểm tra xem đã có categories chưa
    const existingCount = await NewsCategory.countDocuments();
    if (existingCount > 0) {
      console.log("News categories already exist. Skipping migration.");
      return;
    }

    // Tạo các categories mặc định
    for (const categoryData of defaultCategories) {
      const existingCategory = await NewsCategory.findOne({
        slug: categoryData.slug,
      });
      if (!existingCategory) {
        const category = new NewsCategory(categoryData);
        await category.save();
        console.log(`Created news category: ${categoryData.name}`);
      }
    }

    console.log("Default news categories created successfully!");
  } catch (error) {
    console.error("Error creating default news categories:", error);
  } finally {
    await mongoose.disconnect();
  }
}

// Chạy migration nếu file này được gọi trực tiếp
if (require.main === module) {
  createDefaultNewsCategories();
}

export { createDefaultNewsCategories };
