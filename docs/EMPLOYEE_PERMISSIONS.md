# Cấu Hình Quyền Hạn Nhân Viên và Sidebar

Script này cấu hình các quyền cho sidebar và giới hạn quyền của nhân viên (employee).

## Cách Hoạt Động của Hệ Thống Phân Quyền

Hệ thống phân quyền hoạt động qua 2 lớp:

1. **Cấp độ menu sidebar**: Mỗi menu item có `allowedRoles` (vai trò được phép) và `metadata.permissions` (các quyền chi tiết)
2. **Cấp độ chức năng**: Sử dụng `PermissionGuard` để kiểm tra quyền khi thực hiện các hành động

## Cấu Hình Quyền Hạn Cơ Bản

### 1. Cập Nhật Quyền Trong Sidebar

File `update-sidebar-permissions.ts` cấu hình quyền cho từng menu item:

```typescript
// Quyền cho từng menu
const permissionMap = {
  // Trang chủ Admin - tất cả employee có thể xem dashboard cơ bản
  dashboard: ["view_dashboard"],

  // Quản lý người dùng - giới hạn chặt cho employee
  users: ["view_users"], // employee chỉ được xem danh sách
  "employee-management": ["view_users"], // Chỉ admin có tất cả quyền
  developers: ["view_users"],

  // Quản lý bài đăng - employee có thể thực hiện nhiều việc
  posts: ["view_posts", "edit_post", "approve_post", "reject_post"],

  // Quản lý tin tức - employee có thể tạo/sửa tin
  news: ["view_posts", "create_post", "edit_post"],
  "news-categories": ["view_posts"],

  // Quản lý giao dịch - employee chỉ xem
  transactions: ["view_transactions"],
  packages: ["view_transactions"],

  // Thống kê chi tiết - chỉ employee được cấp quyền mới xem được
  stats: ["view_statistics"],

  // Cài đặt - chỉ admin
  settings: ["view_settings"],
  "sidebar-config": [], // Chỉ admin

  // Quản lý dữ liệu - employee có thể xem
  locations: ["view_settings"],
  projects: ["view_posts", "create_post", "edit_post"],
  categories: ["view_settings"],
  areas: ["view_settings"],
  prices: ["view_settings"],
};
```

### 2. Trong Component Sử Dụng PermissionGuard

Bọc các chức năng nhạy cảm bằng `PermissionGuard`:

```tsx
<PermissionGuard permission={Permission.EDIT_USER}>
  <button onClick={handleEdit}>Chỉnh sửa người dùng</button>
</PermissionGuard>
```

Kiểm tra nhiều quyền:

```tsx
<PermissionGuard
  permissions={[Permission.DELETE_USER, Permission.CHANGE_USER_ROLE]}
  requireAll={false}
>
  {/* Hiển thị nếu có ít nhất 1 trong 2 quyền */}
</PermissionGuard>
```

### 3. Bảo Vệ API Endpoint

Kiểm tra quyền ở cả backend:

```typescript
// Controller người dùng
static async updateUser(req: AuthRequest, res: Response) {
  try {
    // Kiểm tra quyền
    if (req.user.role !== 'admin' && !hasPermission(req.user, 'edit_user')) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thực hiện hành động này'
      });
    }

    // Xử lý...
  } catch (err) {
    // Xử lý lỗi
  }
}
```

## Quyền Hạn Chi Tiết cho Employee

### Quản lý người dùng

- ✅ Xem danh sách người dùng
- ❌ Tạo người dùng mới
- ❌ Xóa người dùng
- ✅ Chỉnh sửa thông tin cơ bản (không đổi role)
- ❌ Thay đổi vai trò người dùng
- ✅ Thay đổi trạng thái (chỉ active/inactive)

### Quản lý bài đăng

- ✅ Xem tất cả bài đăng
- ✅ Duyệt/từ chối bài đăng
- ✅ Chỉnh sửa nội dung bài đăng
- ✅ Thêm bài đăng mới
- ❌ Xóa bài đăng

### Cài đặt hệ thống

- ❌ Không có quyền truy cập
- ❌ Không cấu hình sidebar

### Báo cáo và thống kê

- ✅ Xem báo cáo và thống kê cơ bản
- ❌ Không có quyền xuất báo cáo nhạy cảm

## Hướng Dẫn Triển Khai

1. Cập nhật file `update-sidebar-permissions.ts`
2. Chạy script để cập nhật cấu hình trong DB: `npm run update-sidebar-permissions`
3. Kiểm tra các component có sử dụng `PermissionGuard` để bảo vệ các hành động nhạy cảm
