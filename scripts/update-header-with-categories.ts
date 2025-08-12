import { connect, disconnect } from "mongoose";
import { HeaderMenu } from "../src/models/HeaderMenu";
import { Category } from "../src/models/Category";

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

async function updateHeaderMenusWithCategories() {
  try {
    await connectDB();

    // Lấy tất cả categories hiện có
    const categories = await Category.find({ isActive: true }).sort({
      order: 1,
    });
    console.log("📦 Found categories:", categories.length);

    // Tạo dropdown items cho Mua bán từ categories
    const muaBanDropdownItems = categories
      .filter((cat) => !cat.isProject) // Chỉ lấy categories không phải dự án
      .map((cat, index) => ({
        id: `mua-ban-${cat.slug}`,
        label: cat.name,
        href: `/mua-ban?category=${cat.slug}`,
        order: index + 1,
        isActive: true,
      }));

    // Tạo dropdown items cho Cho thuê từ categories
    const choThueDropdownItems = categories
      .filter((cat) => !cat.isProject) // Chỉ lấy categories không phải dự án
      .map((cat, index) => ({
        id: `cho-thue-${cat.slug}`,
        label: cat.name,
        href: `/cho-thue?category=${cat.slug}`,
        order: index + 1,
        isActive: true,
      }));

    // Tạo dropdown items cho Dự án từ categories
    const duAnDropdownItems = categories
      .filter((cat) => cat.isProject) // Chỉ lấy categories dự án
      .map((cat, index) => ({
        id: `du-an-${cat.slug}`,
        label: cat.name,
        href: `/du-an?category=${cat.slug}`,
        order: index + 1,
        isActive: true,
      }));

    // Cập nhật header menus với categories mới
    const updatedHeaderMenus = [
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
        dropdownItems: muaBanDropdownItems,
      },
      {
        label: "Cho thuê",
        href: "/cho-thue",
        order: 3,
        isActive: true,
        hasDropdown: true,
        dropdownItems: choThueDropdownItems,
      },
      {
        label: "Dự án",
        href: "/du-an",
        order: 4,
        isActive: true,
        hasDropdown: duAnDropdownItems.length > 0,
        dropdownItems: duAnDropdownItems,
      },
      {
        label: "Tin tức",
        href: "/tin-tuc",
        order: 5,
        isActive: true,
        hasDropdown: false, // Will be updated dynamically by news categories
        dropdownItems: [], // Will be updated dynamically by news categories
      },
      {
        label: "Liên hệ",
        href: "/lien-he",
        order: 6,
        isActive: true,
        hasDropdown: false,
        dropdownItems: [],
      },
    ];

    // Xóa header menus cũ và thêm mới
    await HeaderMenu.deleteMany({});
    console.log("🗑️  Cleared old header menus");

    const insertedMenus = await HeaderMenu.insertMany(updatedHeaderMenus);
    console.log(
      `✅ Successfully updated ${insertedMenus.length} header menus with categories:`
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

    console.log("\n🎉 Header menus updated successfully with category links!");
    console.log("\n📝 Summary:");
    console.log(`   - Mua bán có ${muaBanDropdownItems.length} categories`);
    console.log(`   - Cho thuê có ${choThueDropdownItems.length} categories`);
    console.log(`   - Dự án có ${duAnDropdownItems.length} categories`);
  } catch (error) {
    console.error("❌ Error updating header menus:", error);
    process.exit(1);
  } finally {
    await disconnect();
    console.log("📤 Disconnected from MongoDB");
  }
}

// Run the script
updateHeaderMenusWithCategories();
