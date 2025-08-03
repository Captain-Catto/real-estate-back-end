const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/real-estate", {
  //useNewUrlParser: true,
  //useUnifiedTopology: true,
});

// Price Range Schema (copy from your model)
const PriceRangeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ["ban", "cho-thue", "project"],
    default: "ban",
  },
  minValue: {
    type: Number,
    default: 0,
  },
  maxValue: {
    type: Number,
    default: -1, // -1 means unlimited
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const PriceRange = mongoose.model("PriceRange", PriceRangeSchema);

// Sample price ranges data
const priceRanges = [
  // Rental price ranges (cho-thue)
  {
    id: "rent_under_5m",
    name: "Dưới 5 triệu",
    slug: "thue-duoi-5-trieu",
    type: "cho-thue",
    minValue: 0,
    maxValue: 5000000,
    order: 1,
    isActive: true,
  },
  {
    id: "rent_5_10m",
    name: "5 - 10 triệu",
    slug: "thue-5-10-trieu",
    type: "cho-thue",
    minValue: 5000000,
    maxValue: 10000000,
    order: 2,
    isActive: true,
  },
  {
    id: "rent_10_15m",
    name: "10 - 15 triệu",
    slug: "thue-10-15-trieu",
    type: "cho-thue",
    minValue: 10000000,
    maxValue: 15000000,
    order: 3,
    isActive: true,
  },
  {
    id: "rent_15_20m",
    name: "15 - 20 triệu",
    slug: "thue-15-20-trieu",
    type: "cho-thue",
    minValue: 15000000,
    maxValue: 20000000,
    order: 4,
    isActive: true,
  },
  {
    id: "rent_over_20m",
    name: "Trên 20 triệu",
    slug: "thue-tren-20-trieu",
    type: "cho-thue",
    minValue: 20000000,
    maxValue: -1,
    order: 5,
    isActive: true,
  },

  // Sale price ranges (ban)
  {
    id: "sale_under_500m",
    name: "Dưới 500 triệu",
    slug: "ban-duoi-500-trieu",
    type: "ban",
    minValue: 0,
    maxValue: 500000000,
    order: 1,
    isActive: true,
  },
  {
    id: "sale_500m_1b",
    name: "500 triệu - 1 tỷ",
    slug: "ban-500-trieu-1-ty",
    type: "ban",
    minValue: 500000000,
    maxValue: 1000000000,
    order: 2,
    isActive: true,
  },
  {
    id: "sale_1_2b",
    name: "1 - 2 tỷ",
    slug: "ban-1-2-ty",
    type: "ban",
    minValue: 1000000000,
    maxValue: 2000000000,
    order: 3,
    isActive: true,
  },
  {
    id: "sale_2_3b",
    name: "2 - 3 tỷ",
    slug: "ban-2-3-ty",
    type: "ban",
    minValue: 2000000000,
    maxValue: 3000000000,
    order: 4,
    isActive: true,
  },
  {
    id: "sale_3_5b",
    name: "3 - 5 tỷ",
    slug: "ban-3-5-ty",
    type: "ban",
    minValue: 3000000000,
    maxValue: 5000000000,
    order: 5,
    isActive: true,
  },
  {
    id: "sale_over_5b",
    name: "Trên 5 tỷ",
    slug: "ban-tren-5-ty",
    type: "ban",
    minValue: 5000000000,
    maxValue: -1,
    order: 6,
    isActive: true,
  },

  // Project price ranges (dự án)
  {
    id: "project_under_1b",
    name: "Dưới 1 tỷ",
    slug: "du-an-duoi-1-ty",
    type: "project",
    minValue: 0,
    maxValue: 1000000000,
    order: 1,
    isActive: true,
  },
  {
    id: "project_1_3b",
    name: "1 - 3 tỷ",
    slug: "du-an-1-3-ty",
    type: "project",
    minValue: 1000000000,
    maxValue: 3000000000,
    order: 2,
    isActive: true,
  },
  {
    id: "project_3_5b",
    name: "3 - 5 tỷ",
    slug: "du-an-3-5-ty",
    type: "project",
    minValue: 3000000000,
    maxValue: 5000000000,
    order: 3,
    isActive: true,
  },
  {
    id: "project_5_10b",
    name: "5 - 10 tỷ",
    slug: "du-an-5-10-ty",
    type: "project",
    minValue: 5000000000,
    maxValue: 10000000000,
    order: 4,
    isActive: true,
  },
  {
    id: "project_10_20b",
    name: "10 - 20 tỷ",
    slug: "du-an-10-20-ty",
    type: "project",
    minValue: 10000000000,
    maxValue: 20000000000,
    order: 5,
    isActive: true,
  },
  {
    id: "project_over_20b",
    name: "Trên 20 tỷ",
    slug: "du-an-tren-20-ty",
    type: "project",
    minValue: 20000000000,
    maxValue: -1,
    order: 6,
    isActive: true,
  },

  // Negotiable prices
  {
    id: "negotiable_sale",
    name: "Thỏa thuận",
    slug: "ban-thoa-thuan",
    type: "ban",
    minValue: 0,
    maxValue: -1,
    order: 999,
    isActive: true,
  },
  {
    id: "negotiable_rent",
    name: "Thỏa thuận",
    slug: "thue-thoa-thuan",
    type: "cho-thue",
    minValue: 0,
    maxValue: -1,
    order: 999,
    isActive: true,
  },
  {
    id: "negotiable_project",
    name: "Thỏa thuận",
    slug: "du-an-thoa-thuan",
    type: "project",
    minValue: 0,
    maxValue: -1,
    order: 999,
    isActive: true,
  },
];

async function populatePriceRanges() {
  try {
    console.log("🗑️ Clearing existing price ranges...");
    await PriceRange.deleteMany({});

    console.log("📊 Inserting new price ranges...");
    await PriceRange.insertMany(priceRanges);

    console.log("✅ Successfully populated price ranges!");

    const count = await PriceRange.countDocuments();
    console.log(`📈 Total price ranges created: ${count}`);

    // Display created ranges
    const created = await PriceRange.find().sort({ type: 1, order: 1 });
    created.forEach((range) => {
      const min =
        range.minValue === 0
          ? "Không giới hạn"
          : range.minValue.toLocaleString();
      const max =
        range.maxValue === -1
          ? "Không giới hạn"
          : range.maxValue.toLocaleString();
      console.log(
        `📊 ${range.type}: ${range.name} (${range.slug}) - ${min} -> ${max}`
      );
    });
  } catch (error) {
    console.error("❌ Error populating price ranges:", error);
  } finally {
    mongoose.connection.close();
  }
}

populatePriceRanges();
