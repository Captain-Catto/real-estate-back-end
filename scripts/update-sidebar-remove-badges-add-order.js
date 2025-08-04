const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function connectToDatabase() {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB successfully");
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    process.exit(1);
  }
}

async function updateSidebarConfig() {
  try {
    console.log("🔄 Updating sidebar config to remove badges and add order...");

    // Define schema directly since we're using JS
    const sidebarConfigSchema = new mongoose.Schema(
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        groups: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            order: { type: Number, required: true, default: 0 },
            items: [
              {
                id: { type: String, required: true },
                name: { type: String, required: true },
                href: { type: String, required: true },
                order: { type: Number, required: true },
                isActive: { type: Boolean, default: true },
                roles: [{ type: String, required: true }],
                description: String,
                children: [{ type: mongoose.Schema.Types.Mixed }],
              },
            ],
            isCollapsible: { type: Boolean, default: true },
            defaultExpanded: { type: Boolean, default: false },
          },
        ],
        isDefault: { type: Boolean, default: false },
        version: { type: Number, default: 1 },
        createdBy: { type: String, default: "system" },
        lastModifiedBy: { type: String, default: "system" },
      },
      {
        timestamps: true,
      }
    );

    const SidebarConfig = mongoose.model("SidebarConfig", sidebarConfigSchema);

    // Update all sidebar configs to remove badge fields and add order to groups
    const result = await SidebarConfig.updateMany(
      {},
      {
        $unset: {
          "groups.$[].items.$[].badge": "",
        },
        $set: {
          "groups.0.order": 1,
          "groups.1.order": 2,
          "groups.2.order": 3,
          "groups.3.order": 4,
          "groups.4.order": 5,
          "groups.5.order": 6,
          "groups.6.order": 7,
          "groups.7.order": 8,
        },
      }
    );

    console.log("✅ Update result:", result);
    console.log(`📊 Modified ${result.modifiedCount} documents`);

    console.log("\n🎉 Sidebar config update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating sidebar config:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await updateSidebarConfig();

    console.log("\n✨ All done! Closing database connection...");
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  updateSidebarConfig,
};
