import mongoose from "mongoose";
import { LocationModel } from "../src/models/Location";
import data from "../locationVN.json";

async function main() {
  await mongoose.connect("mongodb://localhost:27017/real-estate");
  try {
    await LocationModel.deleteMany({}); // Xóa dữ liệu cũ nếu có
    await LocationModel.insertMany(data);
    console.log("Import thành công!");
  } catch (err) {
    console.error("Import lỗi:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
