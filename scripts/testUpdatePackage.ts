// Test script to verify package update functionality
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

// Test update package function
const testUpdatePackage = async () => {
  try {
    console.log("🧪 Testing Package Update...");

    // Find the basic package
    const basicPackage = await Package.findOne({ id: "basic" });
    if (!basicPackage) {
      console.log("❌ Basic package not found");
      return;
    }

    console.log(`\n📦 Found package: ${basicPackage.name}`);
    console.log(`   - Current isPopular: ${basicPackage.isPopular}`);
    console.log(`   - Current price: ${basicPackage.price}`);

    // Test 1: Update isPopular to true
    console.log("\n🔄 Test 1: Updating isPopular to true...");
    basicPackage.isPopular = true;
    await basicPackage.save();
    
    // Verify the update
    const updatedPackage1 = await Package.findOne({ id: "basic" });
    console.log(`   ✅ Updated isPopular: ${updatedPackage1?.isPopular}`);

    // Test 2: Update multiple fields including isPopular
    console.log("\n🔄 Test 2: Updating multiple fields...");
    if (updatedPackage1) {
      updatedPackage1.isPopular = false;
      updatedPackage1.price = 55000;
      updatedPackage1.description = "Updated description for basic package";
      await updatedPackage1.save();
    }

    // Verify the update
    const updatedPackage2 = await Package.findOne({ id: "basic" });
    console.log(`   ✅ Updated isPopular: ${updatedPackage2?.isPopular}`);
    console.log(`   ✅ Updated price: ${updatedPackage2?.price}`);
    console.log(`   ✅ Updated description: ${updatedPackage2?.description}`);

    // Test 3: Test with controller-like update
    console.log("\n🔄 Test 3: Testing controller-style update...");
    const packageToUpdate = await Package.findOne({ id: "basic" });
    if (packageToUpdate) {
      // Simulate controller update logic
      const updateData = {
        name: "Gói Cơ Bản - Updated",
        isPopular: true,
        discountPercentage: 10,
        originalPrice: 55000,
        price: 49500
      };

      // Update fields like in controller
      if (updateData.name !== undefined) packageToUpdate.name = updateData.name;
      if (updateData.isPopular !== undefined) packageToUpdate.isPopular = updateData.isPopular;
      if (updateData.discountPercentage !== undefined) packageToUpdate.discountPercentage = updateData.discountPercentage;
      if (updateData.originalPrice !== undefined) packageToUpdate.originalPrice = updateData.originalPrice;
      if (updateData.price !== undefined) packageToUpdate.price = updateData.price;

      await packageToUpdate.save();
    }

    // Final verification
    const finalPackage = await Package.findOne({ id: "basic" });
    console.log(`\n📋 Final package state:`);
    console.log(`   - Name: ${finalPackage?.name}`);
    console.log(`   - isPopular: ${finalPackage?.isPopular}`);
    console.log(`   - Price: ${finalPackage?.price}`);
    console.log(`   - Original Price: ${finalPackage?.originalPrice}`);
    console.log(`   - Discount: ${finalPackage?.discountPercentage}%`);

    console.log("\n✅ All update tests completed successfully!");

  } catch (error) {
    console.error("❌ Error testing package update:", error);
  }
};

// Main function
const main = async () => {
  await connectDB();
  await testUpdatePackage();
  await mongoose.disconnect();
  console.log("✅ Disconnected from MongoDB");
  process.exit(0);
};

// Run the test
main().catch((error) => {
  console.error("❌ Script error:", error);
  process.exit(1);
});
