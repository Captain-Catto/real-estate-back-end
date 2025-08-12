const mongoose = require("mongoose");

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/real-estate", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schema cho SidebarItem
const sidebarItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  href: { type: String, required: true },
  icon: { type: String, required: true },
  group: { type: String, required: true },
  order: { type: Number, required: true },
  permission: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SidebarItem",
    default: null,
  },
  target: {
    type: String,
    enum: ["admin", "employee", "both"],
    default: "both",
  },
});

const SidebarItem = mongoose.model("SidebarItem", sidebarItemSchema);

async function addPostApprovalMenu() {
  try {
    // Kiểm tra xem đã có menu "Duyệt tin đăng" chưa
    const existingItem = await SidebarItem.findOne({
      title: "Duyệt tin đăng",
      href: "/admin/duyet-tin-dang",
    });

    if (existingItem) {
      console.log('✅ Menu "Duyệt tin đăng" đã tồn tại');
      return;
    }

    // Tạo menu mới
    const newMenuItem = new SidebarItem({
      title: "Duyệt tin đăng",
      href: "/admin/duyet-tin-dang",
      icon: "CheckCircleIcon",
      group: "Quản lý tin đăng",
      order: 102, // Đặt sau "Quản lý tin đăng" (order: 101)
      permission: "approve_post",
      isActive: true,
      parentId: null,
      target: "both", // Cho cả admin và employee
    });

    await newMenuItem.save();
    console.log('✅ Đã thêm menu "Duyệt tin đăng" thành công!');
    console.log("📍 URL: /admin/duyet-tin-dang");
    console.log("🔑 Permission: approve_post");
  } catch (error) {
    console.error("❌ Lỗi khi thêm menu:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Chạy script
addPostApprovalMenu();
