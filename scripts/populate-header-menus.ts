import { connect, disconnect } from "mongoose";
import { HeaderMenu } from "../src/models/HeaderMenu";

async function connectDB() {
  try {
    await connect("mongodb://localhost:27017/real-estate", {
      authSource: "admin",
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

const defaultHeaderMenus = [
  {
    label: "Trang chủ",
    href: "/",
    order: 1,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
  {
    label: "Mua bán",
    href: "/mua-ban",
    order: 2,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "2-1",
        label: "Bán căn hộ chung cư",
        href: "/mua-ban/ban-can-ho-chung-cu",
        order: 1,
        isActive: true,
      },
      {
        id: "2-2",
        label: "Bán nhà riêng",
        href: "/mua-ban/ban-nha-rieng",
        order: 2,
        isActive: true,
      },
      {
        id: "2-3",
        label: "Bán nhà biệt thự, liền kề",
        href: "/mua-ban/ban-nha-biet-thu-lien-ke",
        order: 3,
        isActive: true,
      },
      {
        id: "2-4",
        label: "Bán nhà mặt phố",
        href: "/mua-ban/ban-nha-mat-pho",
        order: 4,
        isActive: true,
      },
    ],
  },
  {
    label: "Cho thuê",
    href: "/cho-thue",
    order: 3,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "3-1",
        label: "Thuê căn hộ chung cư",
        href: "/cho-thue/thue-can-ho-chung-cu",
        order: 1,
        isActive: true,
      },
      {
        id: "3-2",
        label: "Thuê nhà riêng",
        href: "/cho-thue/thue-nha-rieng",
        order: 2,
        isActive: true,
      },
      {
        id: "3-3",
        label: "Thuê nhà mặt phố",
        href: "/cho-thue/thue-nha-mat-pho",
        order: 3,
        isActive: true,
      },
    ],
  },
  {
    label: "Dự án",
    href: "/du-an",
    order: 4,
    isActive: true,
    hasDropdown: false,
    dropdownItems: [],
  },
  {
    label: "Tin tức",
    href: "/tin-tuc",
    order: 5,
    isActive: true,
    hasDropdown: true,
    dropdownItems: [
      {
        id: "5-1",
        label: "Tin tức mua bán",
        href: "/tin-tuc/mua-ban",
        order: 1,
        isActive: true,
      },
      {
        id: "5-2",
        label: "Tin tức cho thuê",
        href: "/tin-tuc/cho-thue",
        order: 2,
        isActive: true,
      },
      {
        id: "5-3",
        label: "Tài chính bất động sản",
        href: "/tin-tuc/tai-chinh",
        order: 3,
        isActive: true,
      },
      {
        id: "5-4",
        label: "Phong thủy",
        href: "/tin-tuc/phong-thuy",
        order: 4,
        isActive: true,
      },
    ],
  },
];

async function populateHeaderMenus() {
  try {
    await connectDB();

    // Check if header menus already exist
    const existingMenus = await HeaderMenu.find();

    if (existingMenus.length > 0) {
      console.log(`📦 Found ${existingMenus.length} existing header menus`);
      console.log("🔄 Updating existing menus with latest structure...");

      // Clear existing and insert new ones
      await HeaderMenu.deleteMany({});
    }

    // Insert default header menus
    console.log("📝 Inserting default header menus...");
    const insertedMenus = await HeaderMenu.insertMany(defaultHeaderMenus);

    console.log(
      `✅ Successfully inserted ${insertedMenus.length} header menus:`
    );
    insertedMenus.forEach((menu, index) => {
      console.log(`   ${index + 1}. ${menu.label} (${menu.href})`);
      if (menu.hasDropdown && menu.dropdownItems.length > 0) {
        menu.dropdownItems.forEach((item, subIndex) => {
          console.log(
            `      ${index + 1}.${subIndex + 1}. ${item.label} (${item.href})`
          );
        });
      }
    });

    console.log("\n🎉 Header menus population completed successfully!");
  } catch (error) {
    console.error("❌ Error populating header menus:", error);
    process.exit(1);
  } finally {
    await disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

// Run the script
populateHeaderMenus();
