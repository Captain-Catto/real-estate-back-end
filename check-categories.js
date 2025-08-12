const mongoose = require("mongoose");
require("dotenv").config();

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    isProject: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model("Category", categorySchema);

async function checkCategories() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    const categories = await Category.find({}).sort({ order: 1 });
    console.log(`\n📋 Tất cả categories (${categories.length} danh mục):`);
    categories.forEach((cat, index) => {
      console.log(
        `${index + 1}. ${cat.name} (slug: ${cat.slug}, isProject: ${
          cat.isProject
        }, isActive: ${cat.isActive}, order: ${cat.order})`
      );
    });

    console.log('\n🔍 Tìm danh mục có chứa "Đất":');
    const datCategories = categories.filter((cat) =>
      cat.name.toLowerCase().includes("đất")
    );
    if (datCategories.length > 0) {
      datCategories.forEach((cat) => {
        console.log(
          `   ✅ ${cat.name} (slug: ${cat.slug}, isProject: ${cat.isProject}, isActive: ${cat.isActive})`
        );
      });
    } else {
      console.log('   ❌ Không tìm thấy danh mục nào có chứa "Đất"');
    }

    console.log("\n🏠 Danh mục cho property (isProject: false):");
    const propertyCategories = categories.filter(
      (cat) => !cat.isProject && cat.isActive
    );
    propertyCategories.forEach((cat) => {
      console.log(`   - ${cat.name} (slug: ${cat.slug})`);
    });

    console.log("\n🏢 Danh mục cho project (isProject: true):");
    const projectCategories = categories.filter(
      (cat) => cat.isProject && cat.isActive
    );
    projectCategories.forEach((cat) => {
      console.log(`   - ${cat.name} (slug: ${cat.slug})`);
    });
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkCategories();
