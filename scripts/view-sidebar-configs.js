const mongoose = require("mongoose");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// Define SidebarConfig schema (same as populate script)
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
        icon: { type: String, required: true },
        items: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            href: { type: String, required: true },
            icon: { type: String, required: true },
            order: { type: Number, required: true },
            isActive: { type: Boolean, default: true },
            roles: [{ type: String, required: true }],
            description: String,
            badge: String,
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

async function viewSidebarConfigs() {
  try {
    console.log("📋 Fetching all sidebar configurations...\n");

    const configs = await SidebarConfig.find({}).sort({
      isDefault: -1,
      createdAt: 1,
    });

    if (configs.length === 0) {
      console.log("❌ No sidebar configurations found!");
      console.log(
        "💡 Run the populate script first: node scripts/populate-sidebar-config.js"
      );
      return;
    }

    console.log(`📊 Found ${configs.length} sidebar configuration(s):\n`);

    configs.forEach((config, index) => {
      console.log(`${index + 1}. 📁 ${config.name}`);
      console.log(`   🆔 ID: ${config._id}`);
      console.log(`   🏷️  Default: ${config.isDefault ? "✅ Yes" : "❌ No"}`);
      console.log(`   📅 Created: ${config.createdAt.toLocaleString()}`);
      console.log(`   🔢 Version: ${config.version}`);
      console.log(`   👤 Created by: ${config.createdBy}`);

      // Count groups and items
      const groupCount = config.groups.length;
      const itemCount = config.groups.reduce(
        (total, group) => total + group.items.length,
        0
      );
      console.log(`   📁 Groups: ${groupCount}`);
      console.log(`   📋 Total items: ${itemCount}`);

      // Show role access summary
      const roles = ["admin", "employee"];
      console.log("   👥 Role access:");
      roles.forEach((role) => {
        const accessCount = config.groups.reduce((total, group) => {
          return (
            total +
            group.items.filter((item) => item.roles.includes(role)).length
          );
        }, 0);
        console.log(`      ${role}: ${accessCount} items`);
      });

      // Show groups overview
      console.log("   📚 Groups overview:");
      config.groups.forEach((group, groupIndex) => {
        const expandIcon = group.defaultExpanded ? "📂" : "📁";
        const collapsibleIcon = group.isCollapsible ? "🔽" : "🔒";
        console.log(
          `      ${groupIndex + 1}. ${expandIcon} ${group.name} (${
            group.items.length
          } items) ${collapsibleIcon}`
        );

        // Show first few items as preview
        const previewItems = group.items.slice(0, 3);
        previewItems.forEach((item, itemIndex) => {
          const badge = item.badge ? ` [${item.badge}]` : "";
          const status = item.isActive ? "✅" : "❌";
          console.log(
            `         ${itemIndex + 1}. ${status} ${
              item.name
            }${badge} (${item.roles.join(", ")})`
          );
        });

        if (group.items.length > 3) {
          console.log(`         ... and ${group.items.length - 3} more items`);
        }
      });

      console.log(""); // Empty line between configs
    });

    // Show current default config
    const defaultConfig = configs.find((c) => c.isDefault);
    if (defaultConfig) {
      console.log(`🌟 Current default configuration: "${defaultConfig.name}"`);
    } else {
      console.log("⚠️  No default configuration set!");
    }
  } catch (error) {
    console.error("❌ Error fetching sidebar configurations:", error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await viewSidebarConfigs();

    console.log("\n✨ Configuration review completed!");
    await mongoose.connection.close();
    console.log("👋 Database connection closed");
  } catch (error) {
    console.error("💥 Script failed:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  console.log("🔍 Reviewing sidebar configurations...\n");
  main();
}

module.exports = {
  viewSidebarConfigs,
};
