import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";
import { ProvinceModel, WardModel } from "../models/Location";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/my-backend-app"
    );
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Import provinces and wards from JSON files
const importLocationData = async () => {
  try {
    // Read JSON files
    const provincesData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../../province.json"), "utf-8")
    );
    const wardsData = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../../ward.json"), "utf-8")
    );

    console.log("📊 Found provinces:", Object.keys(provincesData).length);
    console.log("📊 Found wards:", Object.keys(wardsData).length);

    // Clear existing data
    await ProvinceModel.deleteMany({});
    await WardModel.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Import provinces
    const provinces = [];
    for (const [code, data] of Object.entries(provincesData)) {
      const provinceData = data as any;
      provinces.push({
        name: provinceData.name,
        code: code,
        slug: provinceData.slug,
        type: provinceData.type,
        name_with_type: provinceData.name_with_type,
      });
    }

    const createdProvinces = await ProvinceModel.insertMany(provinces);
    console.log(`✅ Imported ${createdProvinces.length} provinces`);

    // Import wards
    const wards = [];
    for (const [code, data] of Object.entries(wardsData)) {
      const wardData = data as any;
      wards.push({
        name: wardData.name,
        code: code,
        slug: wardData.slug,
        type: wardData.type,
        name_with_type: wardData.name_with_type,
        path: wardData.path,
        path_with_type: wardData.path_with_type,
        parent_code: wardData.parent_code,
      });
    }

    const createdWards = await WardModel.insertMany(wards);
    console.log(`✅ Imported ${createdWards.length} wards`);

    // Show sample data
    console.log("\n📋 Sample provinces:");
    const sampleProvinces = await ProvinceModel.find({}).limit(5);
    sampleProvinces.forEach((p) => {
      console.log(`  - ${p.name} (${p.code})`);
    });

    console.log("\n📋 Sample wards:");
    const sampleWards = await WardModel.find({}).limit(5);
    sampleWards.forEach((w) => {
      console.log(`  - ${w.name} (${w.code}) - Parent: ${w.parent_code}`);
    });

    console.log("\n🎉 Import completed successfully!");
  } catch (error) {
    console.error("❌ Import error:", error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await importLocationData();
  await mongoose.disconnect();
  console.log("👋 Disconnected from MongoDB");
  process.exit(0);
};

// Run if called directly
if (require.main === module) {
  main();
}

export { importLocationData };
