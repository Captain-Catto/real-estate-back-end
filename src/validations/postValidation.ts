import { z } from "zod";
import { mongoIdSchema } from "./common";

// Enum cho các hướng nhà/ban công
const directionEnum = z.enum(
  [
    "",
    "Đông",
    "Tây",
    "Nam",
    "Bắc",
    "Đông Nam",
    "Tây Nam",
    "Đông Bắc",
    "Tây Bắc",
  ],
  {
    errorMap: () => ({ message: "Hướng không hợp lệ" }),
  }
);

// Schema cho location
const locationSchema = z.object(
  {
    province: z.string().min(1, "Tỉnh/thành phố là bắt buộc").trim(),
    ward: z.string().min(1, "Phường/xã là bắt buộc").trim(),
    street: z.string().trim().optional(),
  },
  {
    errorMap: () => ({ message: "Thông tin địa chỉ không hợp lệ" }),
  }
);

// Schema tạo post mới
export const createPostSchema = z.object({
  type: z.enum(["ban", "cho-thue"], {
    errorMap: () => ({
      message: 'Loại tin đăng phải là "ban" hoặc "cho-thue"',
    }),
  }),
  title: z
    .string()
    .min(10, "Tiêu đề phải có ít nhất 10 ký tự")
    .max(200, "Tiêu đề không được quá 200 ký tự")
    .trim(),
  description: z
    .string()
    .min(50, "Mô tả phải có ít nhất 50 ký tự")
    .max(1500, "Mô tả không được quá 1500 ký tự")
    .trim(),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0").optional(),
  location: locationSchema,
  category: mongoIdSchema,
  tags: z
    .array(z.string().trim())
    .max(10, "Không được quá 10 tags")
    .optional()
    .default([]),
  images: z
    .array(z.string().url("URL hình ảnh không hợp lệ"))
    .min(1, "Phải có ít nhất 1 hình ảnh")
    .max(20, "Không được quá 20 hình ảnh"),
  area: z.number().min(0, "Diện tích phải lớn hơn hoặc bằng 0").optional(),
  legalDocs: z.string().trim().optional(),
  furniture: z.string().trim().optional(),
  bedrooms: z
    .number()
    .min(0, "Số phòng ngủ phải lớn hơn hoặc bằng 0")
    .optional(),
  bathrooms: z
    .number()
    .min(0, "Số phòng tắm phải lớn hơn hoặc bằng 0")
    .optional(),
  floors: z.number().min(0, "Số tầng phải lớn hơn hoặc bằng 0").optional(),
  houseDirection: directionEnum.optional(),
  balconyDirection: directionEnum.optional(),
  roadWidth: z.string().trim().optional(),
  frontWidth: z.string().trim().optional(),
  packageId: z.string().trim().optional(),
  packageDuration: z
    .number()
    .min(0, "Thời hạn gói phải lớn hơn hoặc bằng 0")
    .optional(),
  project: mongoIdSchema.optional(),
});

// Schema cập nhật post
export const updatePostSchema = createPostSchema.partial().extend({
  id: mongoIdSchema,
});

// Schema tìm kiếm post
export const postSearchSchema = z.object({
  type: z.enum(["ban", "cho-thue"]).optional(),
  category: mongoIdSchema.optional(),
  province: z.string().trim().optional(),
  ward: z.string().trim().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  minArea: z.number().min(0).optional(),
  maxArea: z.number().min(0).optional(),
  bedrooms: z.number().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  status: z
    .enum(["pending", "active", "rejected", "expired", "inactive", "deleted"])
    .optional(),
  priority: z.enum(["normal", "premium", "vip"]).optional(),
  package: z.enum(["free", "basic", "premium", "vip"]).optional(),
  author: mongoIdSchema.optional(),
  project: mongoIdSchema.optional(),
  keyword: z.string().trim().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z
    .enum(["createdAt", "updatedAt", "price", "area", "views"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Schema cập nhật trạng thái post (dành cho admin)
export const updatePostStatusSchema = z
  .object({
    id: mongoIdSchema,
    status: z.enum([
      "pending",
      "active",
      "rejected",
      "expired",
      "inactive",
      "deleted",
    ]),
    rejectedReason: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "rejected" && !data.rejectedReason) {
        return false;
      }
      return true;
    },
    {
      message: "Lý do từ chối là bắt buộc khi từ chối tin đăng",
      path: ["rejectedReason"],
    }
  );

// Schema cho bulk operations
export const bulkPostStatusSchema = z.object({
  postIds: z.array(mongoIdSchema).min(1, "Phải chọn ít nhất 1 tin đăng"),
  status: z.enum(["active", "rejected", "deleted"]),
  rejectedReason: z.string().trim().optional(),
});

// Schema cho params
export const postParamsSchema = z.object({
  id: mongoIdSchema,
});

// Schema cho việc gia hạn post
export const extendPostSchema = z.object({
  id: mongoIdSchema,
  additionalDays: z
    .number()
    .min(1, "Số ngày gia hạn phải lớn hơn 0")
    .max(365, "Số ngày gia hạn không được quá 365 ngày"),
});

// Schema cho thống kê post
export const postStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(["day", "week", "month", "year"]).default("day"),
  category: mongoIdSchema.optional(),
  author: mongoIdSchema.optional(),
});

// Type exports
export type CreatePostRequest = z.infer<typeof createPostSchema>;
export type UpdatePostRequest = z.infer<typeof updatePostSchema>;
export type PostSearchQuery = z.infer<typeof postSearchSchema>;
export type UpdatePostStatusRequest = z.infer<typeof updatePostStatusSchema>;
export type BulkPostStatusRequest = z.infer<typeof bulkPostStatusSchema>;
export type PostParamsRequest = z.infer<typeof postParamsSchema>;
export type ExtendPostRequest = z.infer<typeof extendPostSchema>;
export type PostStatsQuery = z.infer<typeof postStatsSchema>;
