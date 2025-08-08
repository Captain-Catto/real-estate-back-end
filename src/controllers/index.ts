import { Request, Response } from "express";

export class IndexController {
  getIndex(req: Request, res: Response) {
    res.json({
      success: true,
      message: "Welcome to Real Estate Backend API!",
      version: "1.0.0",
      endpoints: {
        auth: {
          register: "POST /api/auth/register",
          login: "POST /api/auth/login",
          refresh: "POST /api/auth/refresh",
          logout: "POST /api/auth/logout",
          logoutAll: "POST /api/auth/logout-all",
          profile: "GET /api/auth/profile",
          updateProfile:
            "PUT /api/auth/profile (username, phoneNumber, avatar only - email cannot be changed)",
          changePassword: "PUT /api/auth/change-password",
          deleteAccount: "DELETE /api/auth/account",
        },
        posts: {
          create: "POST /api/posts",
          getAll: "GET /api/posts",
          getById: "GET /api/posts/:id",
        },
        favorites: {
          add: "POST /api/favorites",
          remove: "DELETE /api/favorites/:postId",
          getAll: "GET /api/favorites",
          checkStatus: "GET /api/favorites/check/:postId",
          getStats: "GET /api/favorites/stats",
        },
        payments: {
          createVNPayUrl: "POST /api/payments/vnpay/create-payment-url",
          vnpayReturn: "GET /api/payments/vnpay/return",
          vnpayIPN: "GET /api/payments/vnpay/ipn",
          history: "GET /api/payments/history",
          details: "GET /api/payments/:orderId",
          checkStatus: "GET /api/payments/check-status/:orderId",
        },
        locations: {
          getProvinces: "GET /api/locations/provinces",
          getLocationNames:
            "GET /api/locations/names?provinceCode=&districtCode=&wardCode=",
          getDistricts: "GET /api/locations/districts/:provinceCode",
          getWards: "GET /api/locations/wards/:provinceCode/:districtCode",
        },
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
export { HeaderSettingsController } from "./HeaderSettingsController";
export { PermissionController } from "./PermissionController";
