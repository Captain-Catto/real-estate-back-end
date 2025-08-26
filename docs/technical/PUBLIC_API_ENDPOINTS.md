# 🌐 PUBLIC API ENDPOINTS

**Base URL:** `http://localhost:8080` (Development)

**Content-Type:** `application/json` (cho tất cả POST/PUT requests)

**Authentication:** Bearer Token trong Authorization header cho protected endpoints

Đây là danh sách các endpoint public có thể truy cập mà không cần authentication:

## 📋 **Authentication & Users**

### 🔐 Auth Endpoints

```
POST /api/auth/register          - Đăng ký tài khoản
Body: {
  "username": "string (required)",
  "email": "string (required, email format)",
  "password": "string (required, min 6 chars)",
  "phoneNumber": "string (optional)"
}

POST /api/auth/login             - Đăng nhập
Body: {
  "email": "string (required)",
  "password": "string (required)"
}

POST /api/auth/refresh           - Refresh access token
Headers: {
  "Authorization": "Bearer <refresh_token>"
}

POST /api/auth/logout            - Đăng xuất
Headers: {
  "Authorization": "Bearer <access_token>"
}

POST /api/auth/logout-all        - Đăng xuất tất cả thiết bị
Headers: {
  "Authorization": "Bearer <access_token>"
}

POST /api/auth/forgot-password   - Quên mật khẩu
Body: {
  "email": "string (required)"
}

POST /api/auth/reset-password    - Reset mật khẩu
Body: {
  "token": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}
```

### 👤 User Public Info

```
GET /api/users/public/:id        - Lấy thông tin công khai của user
Params: {
  "id": "string (userId)"
}
Response: {
  "success": boolean,
  "data": {
    "user": {
      "id": "string",
      "username": "string",
      "avatar": "string",
      "createdAt": "date"
    }
  }
}
```

## 🏠 **Posts & Properties**

### 📝 Posts Endpoints

```
GET /api/posts                      - Lấy danh sách bài đăng
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10, max: 50)",
  "status": "string (active|inactive|pending)",
  "transactionType": "string (sell|rent)",
  "category": "string",
  "province": "string",
  "ward": "string"
}

GET /api/posts/featured             - Lấy bài đăng nổi bật (VIP/Premium)
Query: {
  "limit": "number (default: 10)"
}

GET /api/posts/search               - Tìm kiếm bài đăng với filter
Query: {
  "q": "string (search term)",
  "transactionType": "string (sell|rent)",
  "category": "string",
  "province": "string",
  "ward": "string",
  "priceMin": "number",
  "priceMax": "number",
  "areaMin": "number",
  "areaMax": "number",
  "bedrooms": "number",
  "bathrooms": "number",
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "sortBy": "string (createdAt|price|area)",
  "sortOrder": "string (asc|desc)"
}

GET /api/posts/public/user/:userId  - Lấy bài đăng công khai của user
Params: {
  "userId": "string"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)"
}

GET /api/posts/:postId              - Lấy chi tiết bài đăng
Params: {
  "postId": "string"
}

GET /api/posts/:postId/similar      - Lấy bài đăng tương tự
Params: {
  "postId": "string"
}
Query: {
  "limit": "number (default: 5)"
}

POST /api/posts/:postId/view        - Tăng lượt xem bài đăng
Params: {
  "postId": "string"
}
```

## 🏢 **Projects & Developers**

### 🏗️ Project Endpoints

```
GET /api/projects                - Lấy danh sách dự án
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "status": "string (active|inactive)",
  "province": "string",
  "developer": "string"
}

GET /api/projects/:projectId     - Lấy chi tiết dự án
Params: {
  "projectId": "string"
}
```

### 🏛️ Developer Endpoints

```
GET /api/developers              - Lấy danh sách chủ đầu tư
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)"
}

GET /api/developers/:developerId - Lấy chi tiết chủ đầu tư
Params: {
  "developerId": "string"
}
```

## 📰 **News & Content**

### 📰 News Endpoints

```
GET /api/news                       - Lấy tin tức đã xuất bản
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "category": "string",
  "featured": "boolean"
}

GET /api/news/categories            - Lấy danh mục tin tức
Response: {
  "success": boolean,
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "string",
        "slug": "string",
        "description": "string"
      }
    ]
  }
}

GET /api/news/slug/:slug            - Lấy tin tức theo slug
Params: {
  "slug": "string"
}

GET /api/news/user/:userId          - Lấy tin tức theo user
Params: {
  "userId": "string"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)"
}
```

## 🗂️ **Categories & Locations**

### 📂 Category Endpoints

```
GET /api/categories              - Lấy danh sách danh mục
Response: {
  "success": boolean,
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "string",
        "type": "string (rent|sell|both)",
        "slug": "string"
      }
    ]
  }
}

GET /api/categories/:categoryId  - Lấy chi tiết danh mục
Params: {
  "categoryId": "string"
}
```

### 📍 Location Endpoints

```
GET /api/locations/provinces                              - Lấy danh sách tỉnh/thành
Response: {
  "success": boolean,
  "data": {
    "provinces": [
      {
        "code": "string",
        "name": "string",
        "slug": "string",
        "type": "string (province|city)"
      }
    ]
  }
}

GET /api/locations/names                                  - Lấy tên địa điểm
Query: {
  "province": "string (optional)",
  "ward": "string (optional)"
}

GET /api/locations/province/:slug                         - Lấy tỉnh theo slug
Params: {
  "slug": "string"
}

GET /api/locations/districts/:provinceCode               - Lấy quận/huyện theo mã tỉnh
Params: {
  "provinceCode": "string"
}

GET /api/locations/wards/:provinceCode                   - Lấy phường/xã theo mã tỉnh
Params: {
  "provinceCode": "string"
}

GET /api/locations/location-by-slug/:provinceSlug/:wardSlug? - Lấy địa điểm theo slug
Params: {
  "provinceSlug": "string",
  "wardSlug": "string (optional)"
}

GET /api/locations/breadcrumb-from-slug                  - Lấy breadcrumb từ slug
Query: {
  "provinceSlug": "string (required - không được để trống)",
  "wardSlug": "string (optional)"
}
Response: {
  "success": boolean,
  "data": {
    "province": {
      "name": "string",
      "code": "string",
      "type": "string",
      "slug": "string",
      "name_with_type": "string"
    },
    "ward": {
      "name": "string",
      "code": "string",
      "type": "string",
      "slug": "string",
      "name_with_type": "string"
    },
    "breadcrumb": [
      {
        "name": "string",
        "slug": "string",
        "type": "string (province|ward)"
      }
    ]
  }
}
Success Response (có data): {
  "success": true,
  "data": {
    "province": {
      "name": "Hà Nội",
      "code": "01",
      "type": "Thành phố Trung ương",
      "slug": "ha-noi"
    },
    "ward": {
      "name": "Đống Đa",
      "code": "00001",
      "slug": "phuong-dong-da"
    },
    "breadcrumb": [
      {"name": "Hà Nội", "slug": "ha-noi", "type": "province"},
      {"name": "Đống Đa", "slug": "phuong-dong-da", "type": "ward"}
    ]
  }
}
Success Response (không tìm thấy province): {
  "success": false,
  "message": "Province not found with slug: [slug-name]"
}
Error Response: {
  "success": false,
  "message": "Province slug is required"
}
```

### 🏘️ Area Endpoints

```
GET /api/areas                   - Lấy danh sách khu vực
Response: {
  "success": boolean,
  "data": {
    "areas": [
      {
        "id": "string",
        "name": "string",
        "minSize": "number",
        "maxSize": "number"
      }
    ]
  }
}

GET /api/areas/:areaId           - Lấy chi tiết khu vực
Params: {
  "areaId": "string"
}
```

## 💰 **Pricing & Packages**

### 💵 Price Endpoints

```
GET /api/price-ranges             - Lấy danh sách khoảng giá
Response: {
  "success": boolean,
  "data": {
    "priceRanges": [
      {
        "id": "string",
        "name": "string",
        "minPrice": "number",
        "maxPrice": "number",
        "type": "string (rent|sell|both)"
      }
    ]
  }
}

GET /api/price-ranges/type/:type  - Lấy khoảng giá theo loại (rent/sell)
Params: {
  "type": "string (rent|sell)"
}

GET /api/price-ranges/:slug       - Lấy chi tiết khoảng giá
Params: {
  "slug": "string"
}
```

### 📦 Package Endpoints (Public)

```
GET /api/packages/active         - Lấy các gói dịch vụ đang hoạt động
Response: {
  "success": boolean,
  "data": {
    "packages": [
      {
        "id": "string",
        "name": "string",
        "price": "number",
        "duration": "number",
        "features": ["string"],
        "isActive": "boolean"
      }
    ]
  }
}
```

## 🎛️ **Settings & Configuration**

### 🧭 Header Settings

```
GET /api/header/menus            - Lấy menu header để hiển thị
Response: {
  "success": boolean,
  "data": {
    "menus": [
      {
        "id": "string",
        "title": "string",
        "url": "string",
        "order": "number",
        "isActive": "boolean",
        "children": []
      }
    ]
  }
}
```

## 💳 **Payment (Public callbacks)**

### 💳 Payment Callbacks

```
GET /api/payments/vnpay/callback    - VNPAY callback
Query: {
  "vnp_Amount": "string",
  "vnp_BankCode": "string",
  "vnp_CardType": "string",
  "vnp_OrderInfo": "string",
  "vnp_PayDate": "string",
  "vnp_ResponseCode": "string",
  "vnp_TmnCode": "string",
  "vnp_TransactionNo": "string",
  "vnp_TxnRef": "string",
  "vnp_SecureHash": "string"
}

POST /api/payments/vnpay/ipn       - VNPAY IPN
Body: {
  // Same as callback parameters
}
```

## 📊 **Statistics & Tracking**

### 📈 Stats Endpoints

```
POST /api/stats/track-view       - Track page view (public)
Body: {
  "page": "string (required)",
  "userAgent": "string (optional)",
  "ip": "string (auto-detected)",
  "referrer": "string (optional)"
}
Response: {
  "success": boolean,
  "message": "string"
}
```

## 📞 **Contact**

### 📧 Contact Endpoints

```
POST /api/contact                - Gửi tin nhắn liên hệ
Body: {
  "name": "string (required)",
  "email": "string (required, email format)",
  "phone": "string (optional)",
  "subject": "string (required)",
  "message": "string (required)",
  "type": "string (optional: general|support|complaint)"
}
Response: {
  "success": boolean,
  "message": "string",
  "data": {
    "contactId": "string"
  }
}
```

## 🤖 **AI Services**

### 🧠 AI Endpoints

```
POST /api/ai/chat               - Chat với AI (có thể cần rate limiting)
Body: {
  "message": "string (required)",
  "context": "string (optional)",
  "conversationId": "string (optional)"
}
Headers: {
  "Authorization": "Bearer <token> (optional for anonymous)"
}

POST /api/ai/analyze-property   - Phân tích bất động sản
Body: {
  "propertyData": {
    "location": "string",
    "price": "number",
    "area": "number",
    "type": "string",
    "amenities": ["string"]
  }
}
Response: {
  "success": boolean,
  "data": {
    "analysis": {
      "priceRecommendation": "string",
      "marketTrends": "string",
      "pros": ["string"],
      "cons": ["string"]
    }
  }
}
```

---

## 🔒 **Protected Endpoints** (Cần Authentication)

Các endpoint sau cần có Authorization header với Bearer token:

### 👤 User Account Management

```
GET /api/auth/profile           - Lấy thông tin profile
Headers: {
  "Authorization": "Bearer <access_token>"
}

PUT /api/auth/profile           - Cập nhật profile
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "username": "string (optional)",
  "phoneNumber": "string (optional)",
  "address": "string (optional)",
  "avatar": "string (optional)"
}

PUT /api/auth/change-password   - Đổi mật khẩu
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "currentPassword": "string (required)",
  "newPassword": "string (required, min 6 chars)"
}

DELETE /api/auth/account        - Xóa tài khoản
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "password": "string (required)",
  "reason": "string (optional)"
}
```

### 📝 User Posts Management

```
GET /api/posts/my               - Lấy bài đăng của tôi
Headers: {
  "Authorization": "Bearer <access_token>"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "status": "string (active|inactive|pending)"
}

GET /api/posts/user/:userId     - Lấy bài đăng của user (cần auth)
Headers: {
  "Authorization": "Bearer <access_token>"
}

POST /api/posts                 - Tạo bài đăng mới
Headers: {
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
Body (FormData): {
  "title": "string (required)",
  "description": "string (required)",
  "price": "number (required)",
  "area": "number (required)",
  "category": "string (required)",
  "transactionType": "string (sell|rent)",
  "location": {
    "province": "string",
    "ward": "string",
    "street": "string",
    "project": "string (optional)"
  },
  "bedrooms": "number (optional)",
  "bathrooms": "number (optional)",
  "floors": "number (optional)",
  "images": "File[] (max 20 files)",
  "packageId": "string (required)"
}

PUT /api/posts/:postId          - Cập nhật bài đăng
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  // Same fields as POST
}

PUT /api/posts/:postId/resubmit - Gửi lại bài đăng
Headers: {
  "Authorization": "Bearer <access_token>"
}

DELETE /api/posts/:postId       - Xóa bài đăng
Headers: {
  "Authorization": "Bearer <access_token>"
}

POST /api/posts/:postId/extend  - Gia hạn bài đăng
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "packageId": "string (required)",
  "duration": "number (days)"
}

PATCH /api/posts/:postId/status - Cập nhật trạng thái bài đăng
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "status": "string (active|inactive|pending)"
}
```

### ❤️ Favorites

```
GET /api/favorites              - Lấy danh sách yêu thích
Headers: {
  "Authorization": "Bearer <access_token>"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)"
}

POST /api/favorites             - Thêm vào yêu thích
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "postId": "string (required)"
}

DELETE /api/favorites/:postId   - Xóa khỏi yêu thích
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "postId": "string"
}
```

### 💰 Wallet & Payments

```
GET /api/wallet                 - Lấy thông tin ví
Headers: {
  "Authorization": "Bearer <access_token>"
}
Response: {
  "success": boolean,
  "data": {
    "balance": "number",
    "currency": "string",
    "transactions": []
  }
}

GET /api/payments/history       - Lịch sử giao dịch
Headers: {
  "Authorization": "Bearer <access_token>"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "status": "string (pending|completed|failed)",
  "type": "string (deposit|withdraw|payment)"
}

POST /api/payments/create       - Tạo giao dịch thanh toán
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "amount": "number (required)",
  "packageId": "string (required)",
  "postId": "string (optional)",
  "paymentMethod": "string (vnpay|wallet)",
  "returnUrl": "string (required for vnpay)"
}
```

---

## 🛡️ **Admin Only Endpoints** (Cần Admin Role)

### 📊 Admin Statistics

```
GET /api/admin/stats/overview              - Thống kê tổng quan
GET /api/admin/stats/revenue-chart         - Biểu đồ doanh thu
GET /api/admin/stats/posts-chart           - Biểu đồ phân bố gói tin
GET /api/admin/stats/property-types-chart  - Biểu đồ loại bất động sản
GET /api/admin/stats/top-locations         - Top địa điểm có nhiều tin
GET /api/admin/stats/user-chart           - Biểu đồ người dùng đăng ký
GET /api/admin/stats/page-views           - Thống kê lượt xem trang
```

### 📰 Admin News Management

```
GET /api/news/admin                        - Lấy tin tức admin
POST /api/news/admin                       - Tạo tin tức
GET /api/news/admin/stats                  - Thống kê tin tức
GET /api/news/admin/:id                    - Lấy tin tức theo ID
PUT /api/news/admin/:id                    - Cập nhật tin tức
DELETE /api/news/admin/:id                 - Xóa tin tức
```

### 🗂️ Admin Category Management

```
GET /api/news/admin/categories             - Lấy danh mục tin tức
Headers: {
  "Authorization": "Bearer <access_token>"
}
Permission: manage_news_categories

POST /api/news/admin/categories            - Tạo danh mục tin tức
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "name": "string (required)",
  "description": "string (optional)",
  "slug": "string (optional, auto-generated if not provided)"
}
Permission: manage_news_categories

PUT /api/news/admin/categories/order       - Cập nhật thứ tự danh mục
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "orders": [
    {
      "id": "string",
      "order": "number"
    }
  ]
}
Permission: manage_news_categories

PUT /api/news/admin/categories/:id         - Cập nhật danh mục
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (categoryId)"
}
Body: {
  "name": "string (optional)",
  "description": "string (optional)",
  "slug": "string (optional)"
}
Permission: manage_news_categories

DELETE /api/news/admin/categories/:id      - Xóa danh mục
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (categoryId)"
}
Permission: manage_news_categories
```

### 📞 Admin Contact Management

```
GET /api/admin/contact                     - Lấy tin nhắn liên hệ
Headers: {
  "Authorization": "Bearer <access_token>"
}
Query: {
  "page": "number (default: 1)",
  "limit": "number (default: 10)",
  "status": "string (new|read|replied|closed)",
  "type": "string (general|support|complaint)"
}

GET /api/admin/contact/stats               - Thống kê liên hệ
Headers: {
  "Authorization": "Bearer <access_token>"
}

GET /api/admin/contact/:id                 - Lấy tin nhắn theo ID
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (contactId)"
}

PATCH /api/admin/contact/:id/status        - Cập nhật trạng thái
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (contactId)"
}
Body: {
  "status": "string (required: new|read|replied|closed)",
  "replyMessage": "string (optional, required if status=replied)",
  "note": "string (optional)"
}

POST /api/admin/contact/:id/reply          - Trả lời tin nhắn
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (contactId)"
}
Body: {
  "replyMessage": "string (required)"
}

PATCH /api/admin/contact/bulk/status       - Cập nhật trạng thái hàng loạt
Headers: {
  "Authorization": "Bearer <access_token>"
}
Body: {
  "contactIds": "string[] (required)",
  "status": "string (required: new|read|replied|closed)"
}

DELETE /api/admin/contact/:id              - Xóa tin nhắn liên hệ
Headers: {
  "Authorization": "Bearer <access_token>"
}
Params: {
  "id": "string (contactId)"
}
```

### 🏠 Admin Posts Management

```
POST /api/posts/admin/check-expired        - Kiểm tra tin hết hạn
```

### 📍 Admin Location Management

```
GET /api/locations                         - Lấy địa điểm với con
POST /api/locations                        - Tạo tỉnh
PUT /api/locations/:id                     - Cập nhật tỉnh
DELETE /api/locations/:id                  - Xóa tỉnh
```

### 🎛️ Admin Settings & Configuration

```
GET /api/admin/categories                  - Quản lý danh mục
GET /api/admin/areas                       - Quản lý khu vực
GET /api/admin/prices                      - Quản lý giá
GET /api/admin/packages                    - Quản lý gói dịch vụ
GET /api/sidebar                           - Quản lý sidebar
GET /api/permissions                       - Quản lý phân quyền
GET /api/dashboard                         - Dashboard admin
GET /api/admin/post-expiry                 - Quản lý hết hạn tin
GET /api/admin/payment-scheduler           - Lịch thanh toán
```

### 🧪 Development & Testing

```
GET /api/admin/*                - Tất cả admin endpoints khác
PUT /api/categories/:id         - Quản lý danh mục
PUT /api/projects/:id           - Quản lý dự án
PUT /api/news/:id               - Quản lý tin tức
GET /api/test                   - Testing endpoints
```

---

## 📝 **Usage Examples**

## 📝 **Usage Examples**

### Đăng ký tài khoản:

```javascript
fetch("http://localhost:8080/api/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    username: "nguyenvana",
    email: "nguyenvana@example.com",
    password: "123456",
    phoneNumber: "0901234567",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Đăng nhập:

```javascript
fetch("http://localhost:8080/api/auth/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "nguyenvana@example.com",
    password: "123456",
  }),
})
  .then((response) => response.json())
  .then((data) => {
    // Lưu token để sử dụng cho các API protected
    localStorage.setItem("accessToken", data.data.accessToken);
    console.log(data);
  });
```

### Lấy danh sách bài đăng:

```javascript
fetch("http://localhost:8080/api/posts?page=1&limit=10&transactionType=sell")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Tìm kiếm bài đăng:

```javascript
fetch(
  "http://localhost:8080/api/posts/search?transactionType=sell&province=ha-noi&priceMin=1000000&priceMax=5000000&limit=10&page=1"
)
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Tạo bài đăng mới (cần authentication):

```javascript
const formData = new FormData();
formData.append("title", "Bán nhà 3 tầng tại Hà Nội");
formData.append("description", "Nhà đẹp, vị trí thuận lợi");
formData.append("price", "2000000000");
formData.append("area", "120");
formData.append("category", "nha-o");
formData.append("transactionType", "sell");
formData.append(
  "location",
  JSON.stringify({
    province: "ha-noi",
    ward: "phuong-dong-da",
    street: "Nguyễn Du",
  })
);
formData.append("bedrooms", "3");
formData.append("bathrooms", "2");
formData.append("packageId", "basic-package");
// Thêm files
formData.append("images", fileInput.files[0]);

fetch("http://localhost:8080/api/posts", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
  },
  body: formData,
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Lấy tin tức theo slug:

```javascript
fetch("http://localhost:8080/api/news/slug/tin-tuc-bat-dong-san-2024")
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Track page view:

```javascript
fetch("http://localhost:8080/api/stats/track-view", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    page: "home",
    userAgent: navigator.userAgent,
    referrer: document.referrer,
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Gửi tin nhắn liên hệ:

```javascript
fetch("http://localhost:8080/api/contact", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    phone: "0901234567",
    subject: "Hỏi về dự án ABC",
    message: "Tôi muốn biết thêm thông tin về dự án này.",
    type: "general",
  }),
})
  .then((response) => response.json())
  .then((data) => console.log(data));
```

### Lấy breadcrumb từ slug:

```javascript
// ✅ ĐÚNG - Lấy breadcrumb cho tỉnh và phường
fetch(
  "http://localhost:8080/api/locations/breadcrumb-from-slug?provinceSlug=ha-noi&wardSlug=phuong-dong-da"
)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Response example:
    // {
    //   "success": true,
    //   "data": {
    //     "province": {
    //       "name": "Hà Nội",
    //       "code": "01",
    //       "type": "Thành phố Trung ương",
    //       "slug": "ha-noi"
    //     },
    //     "ward": {
    //       "name": "Đống Đa",
    //       "code": "00001",
    //       "slug": "phuong-dong-da"
    //     },
    //     "breadcrumb": [
    //       {"name": "Hà Nội", "slug": "ha-noi", "type": "province"},
    //       {"name": "Đống Đa", "slug": "phuong-dong-da", "type": "ward"}
    //     ]
    //   }
    // }
  });

// ✅ ĐÚNG - Chỉ lấy breadcrumb cho tỉnh
fetch(
  "http://localhost:8080/api/locations/breadcrumb-from-slug?provinceSlug=ho-chi-minh"
)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Response example:
    // {
    //   "success": true,
    //   "data": {
    //     "province": {
    //       "name": "Hồ Chí Minh",
    //       "code": "79",
    //       "type": "Thành phố Trung ương",
    //       "slug": "ho-chi-minh"
    //     },
    //     "breadcrumb": [
    //       {"name": "Hồ Chí Minh", "slug": "ho-chi-minh", "type": "province"}
    //     ]
    //   }
    // }
  });

// ❌ SAI - Thiếu query parameter provinceSlug
fetch("http://localhost:8080/api/locations/breadcrumb-from-slug")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Error response:
    // {
    //   "success": false,
    //   "message": "Province slug is required"
    // }
  });

// ❌ SAI - provinceSlug rỗng
fetch("http://localhost:8080/api/locations/breadcrumb-from-slug?provinceSlug=")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Error response:
    // {
    //   "success": false,
    //   "message": "Province slug is required"
    // }
  });

// ❌ SAI - Sử dụng parameter name cũ
fetch(
  "http://localhost:8080/api/locations/breadcrumb-from-slug?province=ha-noi"
)
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Error response:
    // {
    //   "success": false,
    //   "message": "Province slug is required"
    // }
  });

// 📝 Lưu ý quan trọng:
// - Sử dụng "provinceSlug" thay vì "province"
// - Sử dụng "wardSlug" thay vì "ward"
// - Province slug phải theo format kebab-case: "ha-noi", "ho-chi-minh", "da-nang"
```
