import mongoose from "mongoose";
import { Package } from "../src/models/Package";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoURI);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Check packages function
const checkPackages = async () => {
  try {
    console.log("🔍 Checking packages in database...");

    const packages = await Package.find({});
    console.log(`📦 Found ${packages.length} packages:`);
    
    packages.forEach((pkg) => {
      console.log(`\n📋 Package Details:`);
      console.log(`   - _id (MongoDB): ${pkg._id}`);
      console.log(`   - id (custom): ${pkg.id}`);
      console.log(`   - name: ${pkg.name}`);
      console.log(`   - price: ${pkg.price.toLocaleString()}đ`);
      console.log(`   - duration: ${pkg.duration} days`);
      console.log(`   - priority: ${pkg.priority}`);
      console.log(`   - isActive: ${pkg.isActive}`);
      console.log(`   - isPopular: ${pkg.isPopular}`);
      console.log(`   - features: ${pkg.features.length} items`);
    });

  } catch (error) {
    console.error("❌ Error checking packages:", error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await checkPackages();
  await mongoose.disconnect();
  console.log("✅ Disconnected from MongoDB");
  process.exit(0);
};

// Run the script
main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});
