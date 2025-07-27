import { Request } from "express";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin" | "employee";
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: "user" | "admin" | "employee";
  createdAt: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  username?: string;
  phoneNumber?: string;
  avatar?: string;
}

export interface DeleteAccountRequest {
  password: string;
}

export interface PostRequest {
  title: string;
  description: string;
  content: string;
  price?: number;
  location?: string;
  category: "apartment" | "house" | "land" | "commercial" | "other";
  tags?: string[];
}

export interface FavoriteRequest {
  postId: string;
}

export interface PaymentRequest {
  amount: number;
  orderInfo?: string;
  postId?: string;
  returnUrl?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PostQuery extends PaginationQuery {
  category?: string;
  status?: string;
  search?: string;
  author?: string;
}

export interface PaymentResponse {
  orderId: string;
  amount: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: string;
  transactionId?: string;
  createdAt: Date;
  completedAt?: Date;
  failedAt?: Date;
}

export interface VNPayCreatePaymentResponse {
  paymentUrl: string;
  orderId: string;
  amount: number;
  description: string;
}
