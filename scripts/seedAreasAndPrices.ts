import mongoose from "mongoose";
import { Area } from "../src/models/Area";
import { PriceRange } from "../src/models/Price";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";

// Sample data for Areas
const areasData = [
  // Property Areas
  {
    id: "under-30m2",
    name: "Dưới 30 m²",
    slug: "duoi-30m2",
    type: "property",
    minValue: 0,
    maxValue: 30,
    order: 1,
    isActive: true,
  },
  {
    id: "30-50m2",
    name: "30 - 50 m²",
    slug: "30-50m2",
    type: "property",
    minValue: 30,
    maxValue: 50,
    order: 2,
    isActive: true,
  },
  {
    id: "50-80m2",
    name: "50 - 80 m²",
    slug: "50-80m2",
    type: "property",
    minValue: 50,
    maxValue: 80,
    order: 3,
    isActive: true,
  },
  {
    id: "80-100m2",
    name: "80 - 100 m²",
    slug: "80-100m2",
    type: "property",
    minValue: 80,
    maxValue: 100,
    order: 4,
    isActive: true,
  },
  {
    id: "100-150m2",
    name: "100 - 150 m²",
    slug: "100-150m2",
    type: "property",
    minValue: 100,
    maxValue: 150,
    order: 5,
    isActive: true,
  },
  {
    id: "150-200m2",
    name: "150 - 200 m²",
    slug: "150-200m2",
    type: "property",
    minValue: 150,
    maxValue: 200,
    order: 6,
    isActive: true,
  },
  {
    id: "200-300m2",
    name: "200 - 300 m²",
    slug: "200-300m2",
    type: "property",
    minValue: 200,
    maxValue: 300,
    order: 7,
    isActive: true,
  },
  {
    id: "over-300m2",
    name: "Trên 300 m²",
    slug: "tren-300m2",
    type: "property",
    minValue: 300,
    maxValue: -1,
    order: 8,
    isActive: true,
  },

  // Project Areas
  {
    id: "project-under-1ha",
    name: "Dưới 1 ha",
    slug: "du-an-duoi-1ha",
    type: "project",
    minValue: 0,
    maxValue: 10000,
    order: 1,
    isActive: true,
  },
  {
    id: "project-1-5ha",
    name: "1 - 5 ha",
    slug: "du-an-1-5ha",
    type: "project",
    minValue: 10000,
    maxValue: 50000,
    order: 2,
    isActive: true,
  },
  {
    id: "project-5-10ha",
    name: "5 - 10 ha",
    slug: "du-an-5-10ha",
    type: "project",
    minValue: 50000,
    maxValue: 100000,
    order: 3,
    isActive: true,
  },
  {
    id: "project-10-50ha",
    name: "10 - 50 ha",
    slug: "du-an-10-50ha",
    type: "project",
    minValue: 100000,
    maxValue: 500000,
    order: 4,
    isActive: true,
  },
  {
    id: "project-over-50ha",
    name: "Trên 50 ha",
    slug: "du-an-tren-50ha",
    type: "project",
    minValue: 500000,
    maxValue: -1,
    order: 5,
    isActive: true,
  },
];

// Sample data for Prices
const pricesData = [
  // Giá bán
  {
    id: "ban-under-500m",
    name: "Dưới 500 triệu",
    slug: "ban-duoi-500-trieu",
    type: "ban",
    minValue: 0,
    maxValue: 500000000,
    order: 1,
    isActive: true,
  },
  {
    id: "ban-500m-1b",
    name: "500 triệu - 1 tỷ",
    slug: "ban-500-trieu-1-ty",
    type: "ban",
    minValue: 500000000,
    maxValue: 1000000000,
    order: 2,
    isActive: true,
  },
  {
    id: "ban-1-2b",
    name: "1 - 2 tỷ",
    slug: "ban-1-2-ty",
    type: "ban",
    minValue: 1000000000,
    maxValue: 2000000000,
    order: 3,
    isActive: true,
  },
  {
    id: "ban-2-3b",
    name: "2 - 3 tỷ",
    slug: "ban-2-3-ty",
    type: "ban",
    minValue: 2000000000,
    maxValue: 3000000000,
    order: 4,
    isActive: true,
  },
  {
    id: "ban-3-5b",
    name: "3 - 5 tỷ",
    slug: "ban-3-5-ty",
    type: "ban",
    minValue: 3000000000,
    maxValue: 5000000000,
    order: 5,
    isActive: true,
  },
  {
    id: "ban-5-7b",
    name: "5 - 7 tỷ",
    slug: "ban-5-7-ty",
    type: "ban",
    minValue: 5000000000,
    maxValue: 7000000000,
    order: 6,
    isActive: true,
  },
  {
    id: "ban-7-10b",
    name: "7 - 10 tỷ",
    slug: "ban-7-10-ty",
    type: "ban",
    minValue: 7000000000,
    maxValue: 10000000000,
    order: 7,
    isActive: true,
  },
  {
    id: "ban-10-15b",
    name: "10 - 15 tỷ",
    slug: "ban-10-15-ty",
    type: "ban",
    minValue: 10000000000,
    maxValue: 15000000000,
    order: 8,
    isActive: true,
  },
  {
    id: "ban-over-15b",
    name: "Trên 15 tỷ",
    slug: "ban-tren-15-ty",
    type: "ban",
    minValue: 15000000000,
    maxValue: -1,
    order: 9,
    isActive: true,
  },

  // Giá thuê
  {
    id: "thue-under-2m",
    name: "Dưới 2 triệu",
    slug: "thue-duoi-2-trieu",
    type: "cho-thue",
    minValue: 0,
    maxValue: 2000000,
    order: 1,
    isActive: true,
  },
  {
    id: "thue-2-5m",
    name: "2 - 5 triệu",
    slug: "thue-2-5-trieu",
    type: "cho-thue",
    minValue: 2000000,
    maxValue: 5000000,
    order: 2,
    isActive: true,
  },
  {
    id: "thue-5-10m",
    name: "5 - 10 triệu",
    slug: "thue-5-10-trieu",
    type: "cho-thue",
    minValue: 5000000,
    maxValue: 10000000,
    order: 3,
    isActive: true,
  },
  {
    id: "thue-10-15m",
    name: "10 - 15 triệu",
    slug: "thue-10-15-trieu",
    type: "cho-thue",
    minValue: 10000000,
    maxValue: 15000000,
    order: 4,
    isActive: true,
  },
  {
    id: "thue-15-20m",
    name: "15 - 20 triệu",
    slug: "thue-15-20-trieu",
    type: "cho-thue",
    minValue: 15000000,
    maxValue: 20000000,
    order: 5,
    isActive: true,
  },
  {
    id: "thue-20-30m",
    name: "20 - 30 triệu",
    slug: "thue-20-30-trieu",
    type: "cho-thue",
    minValue: 20000000,
    maxValue: 30000000,
    order: 6,
    isActive: true,
  },
  {
    id: "thue-30-50m",
    name: "30 - 50 triệu",
    slug: "thue-30-50-trieu",
    type: "cho-thue",
    minValue: 30000000,
    maxValue: 50000000,
    order: 7,
    isActive: true,
  },
  {
    id: "thue-over-50m",
    name: "Trên 50 triệu",
    slug: "thue-tren-50-trieu",
    type: "cho-thue",
    minValue: 50000000,
    maxValue: -1,
    order: 8,
    isActive: true,
  },

  // Giá dự án (VNĐ/m²)
  {
    id: "project-under-10m",
    name: "Dưới 10 triệu/m²",
    slug: "du-an-duoi-10-trieu-m2",
    type: "project",
    minValue: 0,
    maxValue: 10000000,
    order: 1,
    isActive: true,
  },
  {
    id: "project-10-20m",
    name: "10 - 20 triệu/m²",
    slug: "du-an-10-20-trieu-m2",
    type: "project",
    minValue: 10000000,
    maxValue: 20000000,
    order: 2,
    isActive: true,
  },
  {
    id: "project-20-30m",
    name: "20 - 30 triệu/m²",
    slug: "du-an-20-30-trieu-m2",
    type: "project",
    minValue: 20000000,
    maxValue: 30000000,
    order: 3,
    isActive: true,
  },
  {
    id: "project-30-50m",
    name: "30 - 50 triệu/m²",
    slug: "du-an-30-50-trieu-m2",
    type: "project",
    minValue: 30000000,
    maxValue: 50000000,
    order: 4,
    isActive: true,
  },
  {
    id: "project-50-80m",
    name: "50 - 80 triệu/m²",
    slug: "du-an-50-80-trieu-m2",
    type: "project",
    minValue: 50000000,
    maxValue: 80000000,
    order: 5,
    isActive: true,
  },
  {
    id: "project-80-100m",
    name: "80 - 100 triệu/m²",
    slug: "du-an-80-100-trieu-m2",
    type: "project",
    minValue: 80000000,
    maxValue: 100000000,
    order: 6,
    isActive: true,
  },
  {
    id: "project-100-150m",
    name: "100 - 150 triệu/m²",
    slug: "du-an-100-150-trieu-m2",
    type: "project",
    minValue: 100000000,
    maxValue: 150000000,
    order: 7,
    isActive: true,
  },
  {
    id: "project-over-150m",
    name: "Trên 150 triệu/m²",
    slug: "du-an-tren-150-trieu-m2",
    type: "project",
    minValue: 150000000,
    maxValue: -1,
    order: 8,
    isActive: true,
  },
];

async function seedAreasAndPrices() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // Clear existing data
    console.log("\n🗑️  Clearing existing areas and prices...");
    await Area.deleteMany({});
    await PriceRange.deleteMany({});
    console.log("Cleared existing data!");

    // Seed Areas
    console.log("\n🏠 Seeding Areas...");
    for (const areaData of areasData) {
      const area = new Area(areaData);
      await area.save();
      console.log(`✅ Created area: ${area.name} (${area.type})`);
    }

    // Seed Prices
    console.log("\n💰 Seeding Prices...");
    for (const priceData of pricesData) {
      const price = new PriceRange(priceData);
      await price.save();
      console.log(`✅ Created price: ${price.name} (${price.type})`);
    }

    // Summary
    console.log("\n📊 Summary:");
    const totalAreas = await Area.countDocuments();
    const totalPrices = await PriceRange.countDocuments();
    const propertyAreas = await Area.countDocuments({ type: "property" });
    const projectAreas = await Area.countDocuments({ type: "project" });
    const salePrices = await PriceRange.countDocuments({ type: "ban" });
    const rentPrices = await PriceRange.countDocuments({ type: "cho-thue" });
    const projectPrices = await PriceRange.countDocuments({ type: "project" });

    console.log(`📋 Total Areas: ${totalAreas}`);
    console.log(`   - Property Areas: ${propertyAreas}`);
    console.log(`   - Project Areas: ${projectAreas}`);
    console.log(`💵 Total Prices: ${totalPrices}`);
    console.log(`   - Sale Prices (Bán): ${salePrices}`);
    console.log(`   - Rent Prices (Cho thuê): ${rentPrices}`);
    console.log(`   - Project Prices (Dự án): ${projectPrices}`);

    console.log("\n🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the seeding
seedAreasAndPrices();
