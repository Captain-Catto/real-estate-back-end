import { Request, Response } from "express";

export class IndexController {
  getIndex(req: Request, res: Response) {
    res.json({
      success: true,
      message: "🏠 API Backend Bất Động Sản - Chào mừng bạn!",
      version: "1.0.0",
      timestamp: new Date().toISOString(),

      // 🌐 CÁC ENDPOINT CÔNG KHAI (Không cần xác thực)
      publicEndpoints: {
        // 🔐 Xác thực & Đăng ký người dùng
        auth: {
          register: "POST /api/auth/register - Đăng ký tài khoản",
          login: "POST /api/auth/login - Đăng nhập",
          refresh: "POST /api/auth/refresh - Làm mới token",
          logout: "POST /api/auth/logout - Đăng xuất",
          logoutAll: "POST /api/auth/logout-all - Đăng xuất tất cả thiết bị",
          forgotPassword: "POST /api/auth/forgot-password - Quên mật khẩu",
          resetPassword: "POST /api/auth/reset-password - Đặt lại mật khẩu",
          getUserPublic:
            "GET /api/users/public/:userId - Xem thông tin công khai người dùng",
        },

        // 🏠 Bài đăng & Bất động sản (Xem công khai)
        posts: {
          getAll: "GET /api/posts - Lấy danh sách bài đăng",
          getFeatured: "GET /api/posts/featured - Bài đăng nổi bật",
          search: "GET /api/posts/search - Tìm kiếm bài đăng",
          getById: "GET /api/posts/:postId - Xem chi tiết bài đăng",
          getSimilar: "GET /api/posts/:postId/similar - Bài đăng tương tự",
          getPublicUserPosts:
            "GET /api/posts/public/user/:userId - Bài đăng của người dùng",
        },

        // 🏢 Dự án & Khu phát triển
        projects: {
          getAll: "GET /api/projects - Danh sách dự án",
          getById: "GET /api/projects/:projectId - Chi tiết dự án",
        },

        // 🏛️ Chủ đầu tư & Công ty
        developers: {
          getAll: "GET /api/developers - Danh sách chủ đầu tư",
          getById: "GET /api/developers/:developerId - Chi tiết chủ đầu tư",
        },

        // 📰 Tin tức & Bài viết
        news: {
          getAll: "GET /api/news - Danh sách tin tức",
          getFeatured: "GET /api/news/featured - Tin tức nổi bật",
          getLatest: "GET /api/news/latest - Tin tức mới nhất",
          getCategories: "GET /api/news/categories - Danh mục tin tức",
          getByCategory:
            "GET /api/news/category/:categoryId - Tin tức theo danh mục",
          getById: "GET /api/news/:newsId - Chi tiết tin tức",
        },

        // 📂 Danh mục & Phân loại
        categories: {
          getAll: "GET /api/categories - Danh sách danh mục",
          getById: "GET /api/categories/:categoryId - Chi tiết danh mục",
        },

        // 📍 Địa điểm & Vị trí địa lý
        locations: {
          getProvinces:
            "GET /api/locations/provinces - Danh sách tỉnh/thành phố",
          getDistricts:
            "GET /api/locations/districts/:provinceId - Quận/huyện theo tỉnh",
          getWards:
            "GET /api/locations/wards/:districtId - Phường/xã theo quận",
          getLocationNames: "GET /api/locations/names - Lấy tên địa điểm",
        },

        // 🏘️ Khu vực & Vùng miền
        areas: {
          getAll: "GET /api/areas - Danh sách khu vực",
          getById: "GET /api/areas/:areaId - Chi tiết khu vực",
        },

        // 💰 Giá cả & Khoảng giá trị
        prices: {
          getAll: "GET /api/prices - Danh sách khoảng giá",
        },

        // 📦 Gói dịch vụ (Thông tin công khai)
        packages: {
          getActive: "GET /api/packages/active - Gói dịch vụ đang hoạt động",
        },

        // 🧭 Header & Menu điều hướng
        headerSettings: {
          getMenus: "GET /api/header-settings/menus - Lấy menu header",
        },

        // 💳 Callback thanh toán (Webhook công khai)
        payments: {
          vnpayCallback: "GET /api/payments/vnpay/callback - Callback VNPay",
          vnpayIPN: "POST /api/payments/vnpay/ipn - IPN VNPay",
        },

        // 📊 Thống kê & Theo dõi
        stats: {
          trackPageView: "POST /api/stats/page-view - Theo dõi lượt xem trang",
          trackPostView:
            "POST /api/stats/post-view - Theo dõi lượt xem bài đăng",
        },

        // 📞 Liên hệ & Giao tiếp
        contact: {
          sendMessage: "POST /api/contact/send - Gửi tin nhắn liên hệ",
        },

        // 🤖 Dịch vụ AI
        ai: {
          chat: "POST /api/ai/chat - Chat với AI",
          analyzeProperty:
            "POST /api/ai/analyze-property - Phân tích bất động sản",
        },
      },

      // 🔒 CÁC ENDPOINT BẢO MẬT (Cần xác thực)
      protectedEndpoints: {
        // 👤 Quản lý tài khoản người dùng
        userAccount: {
          getProfile:
            "GET /api/auth/profile - Xem thông tin cá nhân [Cần Token]",
          updateProfile:
            "PUT /api/auth/profile - Cập nhật thông tin [Cần Token]",
          changePassword:
            "PUT /api/auth/change-password - Đổi mật khẩu [Cần Token]",
          deleteAccount: "DELETE /api/auth/account - Xóa tài khoản [Cần Token]",
        },

        // 📝 Quản lý bài đăng của người dùng
        userPosts: {
          getMyPosts: "GET /api/posts/my - Bài đăng của tôi [Cần Token]",
          createPost: "POST /api/posts - Tạo bài đăng mới [Cần Token]",
          updatePost: "PUT /api/posts/:postId - Sửa bài đăng [Cần Token]",
          deletePost: "DELETE /api/posts/:postId - Xóa bài đăng [Cần Token]",
          resubmitPost:
            "PUT /api/posts/:postId/resubmit - Gửi lại bài đăng [Cần Token]",
        },

        // ❤️ Quản lý yêu thích
        favorites: {
          getAll: "GET /api/favorites - Danh sách yêu thích [Cần Token]",
          add: "POST /api/favorites - Thêm vào yêu thích [Cần Token]",
          remove:
            "DELETE /api/favorites/:postId - Xóa khỏi yêu thích [Cần Token]",
          checkStatus:
            "GET /api/favorites/check/:postId - Kiểm tra trạng thái [Cần Token]",
          getStats: "GET /api/favorites/stats - Thống kê yêu thích [Cần Token]",
        },

        // 💰 Ví & Thanh toán
        wallet: {
          getWallet: "GET /api/wallet - Thông tin ví [Cần Token]",
          getPaymentHistory:
            "GET /api/payments/history - Lịch sử thanh toán [Cần Token]",
          createPayment:
            "POST /api/payments/create - Tạo giao dịch [Cần Token]",
          getPaymentDetails:
            "GET /api/payments/:orderId - Chi tiết giao dịch [Cần Token]",
        },
      },

      // 📖 HƯỚNG DẪN SỬ DỤNG API
      usage: {
        baseUrl: "http://localhost:8080",
        authentication: {
          public: "Không cần xác thực cho các endpoint công khai",
          protected:
            "Thêm header 'Authorization: Bearer <token>' cho endpoint bảo mật",
          howToGetToken: "Sử dụng /api/auth/login để lấy access token",
        },
        examples: {
          getPosts: "GET http://localhost:8080/api/posts",
          searchPosts:
            "GET http://localhost:8080/api/posts/search?type=sell&province=hanoi",
          login: "POST http://localhost:8080/api/auth/login",
          getProfile:
            "GET http://localhost:8080/api/auth/profile (với Authorization header)",
        },
        notes: [
          "Tất cả response đều có format: { success: boolean, message: string, data?: any }",
          "Sử dụng query parameters để lọc và phân trang",
          "Refresh token được lưu trong HTTP-only cookie",
          "Access token có thời hạn 1 giờ, refresh token có thời hạn 7 ngày",
        ],
      },
    });
  }
}

export { AuthController } from "./AuthController";
export { PostController } from "./PostController";
export { FavoriteController } from "./FavoriteController";
export { PaymentController } from "./PaymentController";
export { LocationController } from "./LocationController";
export { AiController } from "./AiController";
export { AreaController } from "./AreaController";
export { CategoryController } from "./CategoryController";
export { PriceController } from "./PriceController";
export { WalletController } from "./WalletController";
export { AdminController } from "./AdminController";
export { ProjectController } from "./ProjectController";
export { UploadController } from "./UploadController";
export { NotificationController } from "./NotificationController";
export { PackageController } from "./PackageController";
export { NewsController } from "./NewsController";
export { NewsCategoryController } from "./NewsCategoryController";
export { HeaderSettingsController } from "./HeaderSettingsController";
export { PermissionController } from "./PermissionController";
