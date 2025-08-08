import mongoose from "mongoose";
import SidebarConfig from "../src/models/SidebarConfig";
import { config } from "dotenv";

// Load biến môi trường
config();

// Cấu hình cơ sở dữ liệu
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Hàm kết nối DB
const connectDb = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

// Liệt kê tất cả cấu hình sidebar
const listAllSidebarConfigs = async () => {
  try {
    const configs = await SidebarConfig.find({});

    if (configs.length === 0) {
      console.log("Không có cấu hình sidebar nào trong database");
      return;
    }

    console.log(`Tìm thấy ${configs.length} cấu hình sidebar:`);

    configs.forEach((config, index) => {
      console.log(`\n--- Cấu hình #${index + 1} ---`);
      console.log(`ID: ${config._id}`);
      console.log(`Name: ${config.name || "Không có tên"}`);
      console.log(`isDefault: ${config.isDefault}`);
      console.log(`Số lượng items: ${config.items?.length || 0}`);
      console.log(`Ngày tạo: ${config.createdAt}`);
      console.log(`Ngày cập nhật: ${config.updatedAt}`);
    });
  } catch (error) {
    console.error("Lỗi khi liệt kê cấu hình sidebar:", error);
  }
};

// Add script to package.json:
// "list-sidebar-configs": "ts-node list-sidebar-configs.ts"

const main = async () => {
  await connectDb();
  await listAllSidebarConfigs();
  process.exit(0);
};

main();
