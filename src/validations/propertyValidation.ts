import { z } from "zod";
import {
  mongoIdSchema,
  priceSchema,
  areaSchema,
  urlSchema,
  vietnameseAddressSchema,
  paginationSchema,
  sortSchema,
  statusSchema,
  booleanSchema,
} from "./common";

// Property/Post creation validation
export const createPropertySchema = z.object({
  title: z
    .string()
    .min(10, "Tiêu đề phải có ít nhất 10 ký tự")
    .max(200, "Tiêu đề quá dài"),
  description: z
    .string()
    .min(50, "Mô tả phải có ít nhất 50 ký tự")
    .max(5000, "Mô tả quá dài"),

  // Location
  address: vietnameseAddressSchema,
  city: z.string().min(1, "Thành phố không được để trống"),
  district: z.string().min(1, "Quận/Huyện không được để trống"),
  ward: z.string().optional(),

  // Property details
  propertyType: z.enum([
    "apartment",
    "house",
    "villa",
    "townhouse",
    "land",
    "office",
    "shop",
  ]),
  transactionType: z.enum(["sell", "rent"]),
  price: priceSchema,
  priceUnit: z.enum(["total", "per_m2", "per_month"]).optional(),
  area: areaSchema,

  // Features
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  floors: z.number().int().min(1).max(50).optional(),

  // Media
  images: z
    .array(urlSchema)
    .min(1, "Phải có ít nhất 1 hình ảnh")
    .max(20, "Tối đa 20 hình ảnh"),
  videos: z.array(urlSchema).max(5, "Tối đa 5 video").optional(),

  // Contact
  contactName: z
    .string()
    .min(2, "Tên liên hệ phải có ít nhất 2 ký tự")
    .max(100),
  contactPhone: z
    .string()
    .regex(/^[0-9]{10,11}$/, "Số điện thoại không hợp lệ"),
  contactEmail: z.string().email("Email không hợp lệ").optional(),

  // Additional info
  features: z.array(z.string()).optional(),
  nearby: z.array(z.string()).optional(),
  direction: z
    .enum([
      "north",
      "south",
      "east",
      "west",
      "northeast",
      "northwest",
      "southeast",
      "southwest",
    ])
    .optional(),

  // Package selection
  packageId: mongoIdSchema.optional(),
  postDuration: z.number().int().min(1).max(365).optional(),

  // Coordinates
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// Property update validation
export const updatePropertySchema = createPropertySchema.partial();

// Property search/filter validation
export const propertySearchSchema = z
  .object({
    keyword: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    ward: z.string().optional(),
    propertyType: z.string().optional(),
    transactionType: z.enum(["sell", "rent"]).optional(),

    // Price range
    minPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    maxPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),

    // Area range
    minArea: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    maxArea: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),

    // Features
    minBedrooms: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    maxBedrooms: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    minBathrooms: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),
    maxBathrooms: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined)),

    // Status and sorting
    status: statusSchema,
    featured: booleanSchema,
    verified: booleanSchema,

    // Pagination and sorting
    ...paginationSchema.shape,
    ...sortSchema.shape,
  })
  .refine(
    (data) =>
      !data.minPrice || !data.maxPrice || data.minPrice <= data.maxPrice,
    "Giá tối thiểu phải nhỏ hơn giá tối đa"
  )
  .refine(
    (data) => !data.minArea || !data.maxArea || data.minArea <= data.maxArea,
    "Diện tích tối thiểu phải nhỏ hơn diện tích tối đa"
  );

// Property ID parameter validation
export const propertyIdParamSchema = z.object({
  id: mongoIdSchema,
});

// Admin property approval validation
export const approvePropertySchema = z
  .object({
    status: z.enum(["approved", "rejected"]),
    rejectionReason: z
      .string()
      .min(10, "Lý do từ chối phải có ít nhất 10 ký tự")
      .optional(),
  })
  .refine((data) => data.status !== "rejected" || data.rejectionReason, {
    message: "Phải cung cấp lý do khi từ chối",
    path: ["rejectionReason"],
  });

// Feature property validation
export const featurePropertySchema = z.object({
  featured: z.boolean(),
  featuredUntil: z.string().datetime().optional(),
});

// Property statistics query validation
export const propertyStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  propertyType: z.string().optional(),
  transactionType: z.enum(["sell", "rent"]).optional(),
});

// Bulk operations validation
export const bulkPropertyActionSchema = z.object({
  propertyIds: z
    .array(mongoIdSchema)
    .min(1, "Phải chọn ít nhất 1 bất động sản"),
  action: z.enum(["approve", "reject", "feature", "unfeature", "delete"]),
  rejectionReason: z.string().optional(),
});

// Type exports for TypeScript
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertySearchQuery = z.infer<typeof propertySearchSchema>;
export type PropertyIdParam = z.infer<typeof propertyIdParamSchema>;
export type ApprovePropertyInput = z.infer<typeof approvePropertySchema>;
export type FeaturePropertyInput = z.infer<typeof featurePropertySchema>;
export type PropertyStatsQuery = z.infer<typeof propertyStatsQuerySchema>;
export type BulkPropertyActionInput = z.infer<typeof bulkPropertyActionSchema>;
