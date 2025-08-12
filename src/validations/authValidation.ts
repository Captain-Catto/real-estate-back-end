import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  vietnameseNameSchema,
  mongoIdSchema,
} from "./common";

// Register validation
export const registerSchema = z.object({
  fullName: vietnameseNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: z.enum(["user", "admin", "employee"]).optional().default("user"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "Phải đồng ý với điều khoản sử dụng"),
});

// Login validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mật khẩu không được để trống"),
});

// Change password validation
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mật khẩu hiện tại không được để trống"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// Reset password request validation
export const resetPasswordRequestSchema = z.object({
  email: emailSchema,
});

// Reset password validation
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token không được để trống"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

// Update profile validation
export const updateProfileSchema = z.object({
  fullName: vietnameseNameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url("URL avatar không hợp lệ").optional(),
  dateOfBirth: z.string().datetime("Ngày sinh không hợp lệ").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(255, "Địa chỉ quá dài").optional(),
});

// Verify email validation
export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token xác thực không được để trống"),
});

// Refresh token validation
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token không được để trống"),
});

// Admin create user validation
export const adminCreateUserSchema = z.object({
  fullName: vietnameseNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  role: z.enum(["user", "admin", "employee"]).default("user"),
  isEmailVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

// Admin update user validation
export const adminUpdateUserSchema = z.object({
  fullName: vietnameseNameSchema.optional(),
  email: emailSchema.optional(),
  phone: phoneSchema,
  role: z.enum(["user", "admin", "employee"]).optional(),
  isEmailVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// User ID parameter validation
export const userIdParamSchema = z.object({
  id: mongoIdSchema,
});

// Type exports for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
