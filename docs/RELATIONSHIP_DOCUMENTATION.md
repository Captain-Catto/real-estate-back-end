# Tài Liệu Mối Quan Hệ Database - Real Estate Platform

## 📋 Tổng Quan

Tài liệu này mô tả chi tiết các mối quan hệ giữa các bảng trong hệ thống Real Estate Platform, giúp hiểu rõ cấu trúc database và cách các entity tương tác với nhau.

---

## 🔗 Danh Sách Các Mối Quan Hệ

### 1. **User Relations (Quan hệ người dùng)**

#### 1.1 User ← CustomerContact (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều liên hệ khách hàng
- **Khóa ngoại**: `user` trong CustomerContact → `_id` trong User
- **Ý nghĩa**: Theo dõi các yêu cầu liên hệ từ khách hàng đến người dùng

#### 1.2 User ← CustomerContact.contactedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể thực hiện nhiều hành động liên hệ
- **Khóa ngoại**: `contactedBy` trong CustomerContact → `_id` trong User
- **Ý nghĩa**: Xác định ai đã thực hiện hành động liên hệ

#### 1.3 User ← CustomerContact.deletedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể xóa nhiều liên hệ khách hàng
- **Khóa ngoại**: `deletedBy` trong CustomerContact → `_id` trong User
- **Ý nghĩa**: Theo dõi ai đã xóa liên hệ khách hàng

#### 1.4 User ← Favorite (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều bài đăng yêu thích
- **Khóa ngoại**: `user` trong Favorite → `_id` trong User
- **Ý nghĩa**: Hệ thống yêu thích bài đăng của người dùng

#### 1.5 User ← News.author (Many-to-One)

- **Mô tả**: Một người dùng có thể viết nhiều bài tin tức
- **Khóa ngoại**: `author` trong News → `_id` trong User
- **Ý nghĩa**: Xác định tác giả của bài tin tức

#### 1.6 User ← News.moderatedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể kiểm duyệt nhiều bài tin tức
- **Khóa ngoại**: `moderatedBy` trong News → `_id` trong User
- **Ý nghĩa**: Theo dõi ai đã kiểm duyệt bài tin tức

#### 1.7 User ← Notification (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều thông báo
- **Khóa ngoại**: `userId` trong Notification → `_id` trong User
- **Ý nghĩa**: Hệ thống thông báo cá nhân cho từng người dùng

#### 1.8 User ← PageView (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều lượt xem trang
- **Khóa ngoại**: `userId` trong PageView → `_id` trong User
- **Ý nghĩa**: Theo dõi hoạt động xem trang của người dùng

#### 1.9 User ← PasswordResetToken (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều token reset mật khẩu
- **Khóa ngoại**: `userId` trong PasswordResetToken → `_id` trong User
- **Ý nghĩa**: Quản lý token để reset mật khẩu

#### 1.10 User ← Payment (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều giao dịch thanh toán
- **Khóa ngoại**: `userId` trong Payment → `_id` trong User
- **Ý nghĩa**: Theo dõi lịch sử thanh toán của người dùng

#### 1.11 User ← Post.author (Many-to-One)

- **Mô tả**: Một người dùng có thể tạo nhiều bài đăng
- **Khóa ngoại**: `author` trong Post → `_id` trong User
- **Ý nghĩa**: Xác định tác giả của bài đăng

#### 1.12 User ← Post.approvedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể duyệt nhiều bài đăng
- **Khóa ngoại**: `approvedBy` trong Post → `_id` trong User
- **Ý nghĩa**: Theo dõi ai đã duyệt bài đăng

#### 1.13 User ← Post.rejectedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể từ chối nhiều bài đăng
- **Khóa ngoại**: `rejectedBy` trong Post → `_id` trong User
- **Ý nghĩa**: Theo dõi ai đã từ chối bài đăng

#### 1.14 User ← UserLog.userId (Many-to-One)

- **Mô tả**: Một người dùng có thể có nhiều log hoạt động
- **Khóa ngoại**: `userId` trong UserLog → `_id` trong User
- **Ý nghĩa**: Theo dõi hoạt động của người dùng

#### 1.15 User ← UserLog.changedBy (Many-to-One)

- **Mô tả**: Một người dùng có thể thực hiện nhiều thay đổi
- **Khóa ngoại**: `changedBy` trong UserLog → `_id` trong User
- **Ý nghĩa**: Xác định ai đã thực hiện thay đổi

#### 1.16 User ← UserPermission (One-to-One)

- **Mô tả**: Mỗi người dùng có một bộ quyền riêng
- **Khóa ngoại**: `userId` trong UserPermission → `_id` trong User
- **Ý nghĩa**: Quản lý quyền hạn của từng người dùng

#### 1.17 User ← Wallet (One-to-One)

- **Mô tả**: Mỗi người dùng có một ví điện tử riêng
- **Khóa ngoại**: `userId` trong Wallet → `_id` trong User
- **Ý nghĩa**: Quản lý tài chính cá nhân của người dùng

---

### 2. **Post Relations (Quan hệ bài đăng)**

#### 2.1 Post ← CustomerContact (Many-to-One)

- **Mô tả**: Một bài đăng có thể có nhiều liên hệ khách hàng
- **Khóa ngoại**: `post` trong CustomerContact → `_id` trong Post
- **Ý nghĩa**: Theo dõi các yêu cầu liên hệ cho từng bài đăng

#### 2.2 Post ← Favorite (Many-to-One)

- **Mô tả**: Một bài đăng có thể được nhiều người yêu thích
- **Khóa ngoại**: `post` trong Favorite → `_id` trong Post
- **Ý nghĩa**: Hệ thống yêu thích bài đăng

#### 2.3 Post ← Payment (Many-to-One)

- **Mô tả**: Một bài đăng có thể có nhiều giao dịch thanh toán
- **Khóa ngoại**: `postId` trong Payment → `_id` trong Post
- **Ý nghĩa**: Thanh toán cho các gói dịch vụ của bài đăng

#### 2.4 Category ← Post (Many-to-One)

- **Mô tả**: Một danh mục có thể có nhiều bài đăng
- **Khóa ngoại**: `category` trong Post → `_id` trong Category
- **Ý nghĩa**: Phân loại bài đăng theo danh mục

#### 2.5 Project ← Post (Many-to-One)

- **Mô tả**: Một dự án có thể có nhiều bài đăng
- **Khóa ngoại**: `project` trong Post → `_id` trong Project
- **Ý nghĩa**: Liên kết bài đăng với dự án cụ thể

---

### 3. **Project Relations (Quan hệ dự án)**

#### 3.1 Developer ← Project (Many-to-One)

- **Mô tả**: Một nhà phát triển có thể có nhiều dự án
- **Khóa ngoại**: `developer` trong Project → `_id` trong Developer
- **Ý nghĩa**: Xác định nhà phát triển của dự án

#### 3.2 Category ← Project (Many-to-One)

- **Mô tả**: Một danh mục có thể có nhiều dự án
- **Khóa ngoại**: `category` trong Project → `_id` trong Category
- **Ý nghĩa**: Phân loại dự án theo danh mục

---

### 4. **Location Relations (Quan hệ địa lý)**

#### 4.1 Province ← Ward (Many-to-One)

- **Mô tả**: Một tỉnh/thành phố có thể có nhiều phường/xã
- **Khóa ngoại**: `parent_code` trong Ward → `code` trong Province
- **Ý nghĩa**: Cấu trúc địa lý hành chính Việt Nam

---

### 5. **Contact Relations (Quan hệ liên hệ)**

#### 5.1 ContactMessage ← ContactLog (Many-to-One)

- **Mô tả**: Một tin nhắn liên hệ có thể có nhiều log theo dõi
- **Khóa ngoại**: `contactId` trong ContactLog → `_id` trong ContactMessage
- **Ý nghĩa**: Theo dõi lịch sử thay đổi của tin nhắn liên hệ

---

## 📊 Thống Kê Mối Quan Hệ

| **Loại Quan Hệ** | **Số Lượng** | **Mô Tả**                        |
| ---------------- | ------------ | -------------------------------- |
| One-to-One       | 2            | UserPermission, Wallet           |
| One-to-Many      | 24           | Các quan hệ chính trong hệ thống |
| **Tổng cộng**    | **26**       | **Tổng số mối quan hệ**          |

---

## 🏗️ Kiến Trúc Quan Hệ

### **Core Entities (Thực thể chính)**

- **User**: Trung tâm của hệ thống với 17 mối quan hệ
- **Post**: Thực thể chính cho bài đăng với 5 mối quan hệ
- **Project**: Quản lý dự án với 2 mối quan hệ

### **Support Entities (Thực thể hỗ trợ)**

- **Category**: Phân loại cho Post và Project
- **Developer**: Quản lý nhà phát triển
- **Province/Ward**: Cấu trúc địa lý

### **System Entities (Thực thể hệ thống)**

- **Payment, Wallet**: Quản lý tài chính
- **Notification**: Hệ thống thông báo
- **UserLog, ContactLog**: Theo dõi hoạt động

---

## 💡 Lưu Ý Quan Trọng

1. **User-Centric Design**: Hệ thống xoay quanh User với nhiều mối quan hệ phức tạp
2. **Audit Trail**: Các bảng Log giúp theo dõi thay đổi và hoạt động
3. **Geographic Structure**: Province-Ward phản ánh cấu trúc hành chính VN
4. **Business Logic**: Payment-Post-User tạo thành chu trình kinh doanh chính
5. **Content Management**: News-User, Post-User-Category tạo hệ thống quản lý nội dung

---

## 🔍 Ứng Dụng Thực Tế

### **Workflow Chính**:

1. **User** tạo **Post** thuộc **Category** và có thể liên kết **Project**
2. **Post** được duyệt bởi **User** (admin/moderator)
3. **User** khác có thể **Favorite** và **CustomerContact** cho **Post**
4. **Payment** được thực hiện để nâng cấp **Post**
5. Tất cả hoạt động được ghi lại trong **UserLog** và các bảng audit khác

### **Tích Hợp Hệ Thống**:

- **Financial**: User → Wallet → Payment → Post
- **Content**: User → Post → Category → Project → Developer
- **Geographic**: Post → Location → Ward → Province
- **Communication**: User → CustomerContact → Post → ContactMessage → ContactLog
