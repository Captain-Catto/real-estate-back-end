import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  vietnameseNameSchema,
  mongoIdSchema,
  paginationSchema,
  sortSchema,
  statusSchema,
} from "./common";

// User profile update validation
export const updateUserProfileSchema = z.object({
  fullName: vietnameseNameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url("URL avatar không hợp lệ").optional(),
  dateOfBirth: z.string().datetime("Ngày sinh không hợp lệ").optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().max(255, "Địa chỉ quá dài").optional(),
  bio: z.string().max(500, "Tiểu sử quá dài").optional(),
  website: z.string().url("Website không hợp lệ").optional(),
  socialMedia: z
    .object({
      facebook: z.string().url().optional(),
      zalo: z.string().optional(),
      telegram: z.string().optional(),
    })
    .optional(),
});

// User search and filter validation
export const userSearchSchema = z.object({
  keyword: z.string().optional(),
  role: z.enum(["user", "admin", "employee"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
  isEmailVerified: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),

  // Date filters
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Pagination and sorting
  ...paginationSchema.shape,
  ...sortSchema.shape,
});

// Admin update user validation
export const adminUpdateUserSchema = z.object({
  username: z
    .string()
    .min(3, "Tên người dùng phải có ít nhất 3 ký tự")
    .max(50, "Tên người dùng quá dài")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Tên người dùng chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang"
    )
    .optional(),
  email: emailSchema.optional(),
  phoneNumber: phoneSchema,
  role: z.enum(["user", "admin", "employee"]).optional(),
  status: z.enum(["active", "banned"]).optional(),
  permissions: z.array(z.string()).optional(),
});

// User ban/unban validation
export const banUserSchema = z.object({
  reason: z
    .string()
    .min(10, "Lý do cấm phải có ít nhất 10 ký tự")
    .max(500, "Lý do quá dài"),
  duration: z.number().int().min(1).max(365).optional(), // days
  permanent: z.boolean().optional().default(false),
});

// User role assignment validation
export const assignRoleSchema = z.object({
  role: z.enum(["user", "admin", "employee"]),
  permissions: z.array(z.string()).optional(),
});

// User permissions validation
export const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()).min(0, "Danh sách quyền không hợp lệ"),
});

// User statistics query validation
export const userStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  role: z.enum(["user", "admin", "employee"]).optional(),
  groupBy: z.enum(["day", "week", "month", "year"]).optional().default("day"),
});

// Bulk user operations validation
export const bulkUserActionSchema = z
  .object({
    userIds: z.array(mongoIdSchema).min(1, "Phải chọn ít nhất 1 người dùng"),
    action: z.enum([
      "activate",
      "ban",
      "unban",
      "delete",
      "verify_email",
    ]),
    reason: z.string().optional(), // Required for ban action
  })
  .refine((data) => data.action !== "ban" || data.reason, {
    message: "Phải cung cấp lý do khi cấm người dùng",
    path: ["reason"],
  });

// User activity log query validation
export const userActivityQuerySchema = z.object({
  userId: mongoIdSchema.optional(),
  action: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  ...paginationSchema.shape,
  ...sortSchema.shape,
});

// User notification preferences validation
export const notificationPreferencesSchema = z.object({
  email: z
    .object({
      newProperty: z.boolean().default(true),
      priceAlert: z.boolean().default(true),
      newsletter: z.boolean().default(false),
      systemUpdates: z.boolean().default(true),
    })
    .optional(),
  push: z
    .object({
      newProperty: z.boolean().default(true),
      priceAlert: z.boolean().default(true),
      messages: z.boolean().default(true),
    })
    .optional(),
  sms: z
    .object({
      important: z.boolean().default(false),
      priceAlert: z.boolean().default(false),
    })
    .optional(),
});

// User ID parameter validation
export const userIdParamSchema = z.object({
  id: mongoIdSchema,
});

// Type exports for TypeScript
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type UserSearchQuery = z.infer<typeof userSearchSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type BanUserInput = z.infer<typeof banUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
export type UserStatsQuery = z.infer<typeof userStatsQuerySchema>;
export type BulkUserActionInput = z.infer<typeof bulkUserActionSchema>;
export type UserActivityQuery = z.infer<typeof userActivityQuerySchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
