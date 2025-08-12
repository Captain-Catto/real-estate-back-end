const mongoose = require("mongoose");
require("dotenv").config();

const SidebarMenuSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    href: { type: String, required: true },
    icon: { type: String, required: true },
    order: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    permissions: [{ type: String }],
    adminOnly: { type: Boolean, default: false },
    children: [
      {
        title: { type: String, required: true },
        href: { type: String, required: true },
        icon: { type: String },
        order: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
        permissions: [{ type: String }],
        adminOnly: { type: Boolean, default: false },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const SidebarMenu = mongoose.model("SidebarMenu", SidebarMenuSchema);

async function removePostApprovalMenu() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/real-estate"
    );
    console.log("Connected to MongoDB");

    // Xóa menu "Duyệt tin đăng"
    const result = await SidebarMenu.deleteOne({
      href: "/admin/duyet-tin-dang",
    });

    if (result.deletedCount > 0) {
      console.log('✅ Đã xóa menu "Duyệt tin đăng" thành công!');
    } else {
      console.log('⚠️ Không tìm thấy menu "Duyệt tin đăng" để xóa');
    }

    // Hiển thị danh sách menu còn lại
    const remainingMenus = await SidebarMenu.find({}).sort({ order: 1 });
    console.log("\n📋 Danh sách menu còn lại:");
    remainingMenus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.title} (${menu.href})`);
      if (menu.children && menu.children.length > 0) {
        menu.children.forEach((child, childIndex) => {
          console.log(
            `   ${index + 1}.${childIndex + 1}. ${child.title} (${child.href})`
          );
        });
      }
    });
  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    await mongoose.disconnect();
  }
}

removePostApprovalMenu();
