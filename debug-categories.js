const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    debugCategories();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });

// Category Schema
const categorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    isProject: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

async function debugCategories() {
  try {
    console.log("\n📊 CATEGORY ANALYSIS");
    console.log("=".repeat(50));

    // Get all categories
    const allCategories = await Category.find({});
    console.log(`\n📋 Total categories: ${allCategories.length}`);

    // Group by isActive status
    const activeCategories = allCategories.filter(
      (cat) => cat.isActive === true
    );
    const inactiveCategories = allCategories.filter(
      (cat) => cat.isActive === false
    );
    const undefinedCategories = allCategories.filter(
      (cat) => cat.isActive === undefined
    );

    console.log(
      `\n✅ Active categories (isActive: true): ${activeCategories.length}`
    );
    activeCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug}) - Project: ${cat.isProject}`);
    });

    console.log(
      `\n❌ Inactive categories (isActive: false): ${inactiveCategories.length}`
    );
    inactiveCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug}) - Project: ${cat.isProject}`);
    });

    console.log(
      `\n❓ Undefined categories (isActive: undefined): ${undefinedCategories.length}`
    );
    undefinedCategories.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug}) - Project: ${cat.isProject}`);
    });

    // Test filter query
    console.log("\n🔍 TESTING FILTER QUERIES");
    console.log("=".repeat(50));

    // Test 1: Get categories with isProject=false and isActive=true
    const buyRentCategoriesActive = await Category.find({
      isProject: false,
      isActive: true,
    });
    console.log(
      `\n📍 Buy/Rent categories (isProject: false, isActive: true): ${buyRentCategoriesActive.length}`
    );
    buyRentCategoriesActive.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    // Test 2: Get categories with isProject=false (no isActive filter)
    const buyRentCategoriesAll = await Category.find({
      isProject: false,
    });
    console.log(
      `\n📍 Buy/Rent categories (isProject: false, no isActive filter): ${buyRentCategoriesAll.length}`
    );
    buyRentCategoriesAll.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug}) - isActive: ${cat.isActive}`);
    });

    // Test 3: Get project categories with isActive=true
    const projectCategoriesActive = await Category.find({
      isProject: true,
      isActive: true,
    });
    console.log(
      `\n🏗️ Project categories (isProject: true, isActive: true): ${projectCategoriesActive.length}`
    );
    projectCategoriesActive.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug})`);
    });

    // Test 4: Get project categories (no isActive filter)
    const projectCategoriesAll = await Category.find({
      isProject: true,
    });
    console.log(
      `\n🏗️ Project categories (isProject: true, no isActive filter): ${projectCategoriesAll.length}`
    );
    projectCategoriesAll.forEach((cat) => {
      console.log(`  - ${cat.name} (${cat.slug}) - isActive: ${cat.isActive}`);
    });

    console.log("\n✅ Analysis complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error analyzing categories:", error);
    process.exit(1);
  }
}
