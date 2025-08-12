import { z } from "zod";

// Common validation patterns
export const emailSchema = z
  .string()
  .email("Email không hợp lệ")
  .max(255, "Email quá dài");

export const passwordSchema = z
  .string()
  .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
  .max(100, "Mật khẩu quá dài");

export const phoneSchema = z
  .string()
  .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
  .optional();

export const nameSchema = z
  .string()
  .min(2, "Tên phải có ít nhất 2 ký tự")
  .max(100, "Tên quá dài")
  .trim();

export const mongoIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "ID không hợp lệ");

export const urlSchema = z.string().url("URL không hợp lệ").optional();

export const priceSchema = z
  .number()
  .min(0, "Giá phải lớn hơn hoặc bằng 0")
  .max(999999999999, "Giá quá lớn");

export const areaSchema = z
  .number()
  .min(0, "Diện tích phải lớn hơn 0")
  .max(10000, "Diện tích quá lớn");

// Pagination schema
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 1))
    .refine((val) => val > 0, "Page phải lớn hơn 0"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit phải từ 1-100"),
});

// Sort schema
export const sortSchema = z.object({
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Common query filters
export const statusSchema = z
  .enum(["active", "inactive", "pending", "approved", "rejected"])
  .optional();

export const booleanSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined;
  });

// Date schemas
export const dateSchema = z
  .string()
  .datetime("Ngày tháng không hợp lệ")
  .or(z.date());

export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  })
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      new Date(data.startDate) <= new Date(data.endDate),
    "Ngày bắt đầu phải trước ngày kết thúc"
  );

// Vietnamese specific schemas
export const vietnameseNameSchema = z
  .string()
  .min(2, "Tên phải có ít nhất 2 ký tự")
  .max(100, "Tên quá dài")
  .regex(
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/,
    "Tên chỉ được chứa chữ cái và khoảng trắng"
  )
  .trim();

export const vietnameseAddressSchema = z
  .string()
  .min(5, "Địa chỉ phải có ít nhất 5 ký tự")
  .max(255, "Địa chỉ quá dài")
  .trim();
