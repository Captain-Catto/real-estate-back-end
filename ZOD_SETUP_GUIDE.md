# Zod Validation Setup Guide

## 📋 **Tổng quan**

Zod đã được tích hợp vào dự án để thay thế validation thủ công. Hệ thống validation mới cung cấp:

- ✅ Type safety với TypeScript
- ✅ Error messages tiếng Việt
- ✅ Validation middleware tự động
- ✅ Schema reusable cho nhiều endpoints

## 🚀 **Cách sử dụng**

### 1. **Import validation schemas**

```typescript
import {
  validateBody,
  validateParams,
  validateQuery,
  registerSchema,
  loginSchema,
  propertySearchSchema,
} from "../validations";
```

### 2. **Sử dụng trong routes**

```typescript
// Validate request body
router.post("/register", validateBody(registerSchema), authController.register);

// Validate URL parameters
router.get(
  "/users/:id",
  validateParams(userIdParamSchema),
  userController.getUser
);

// Validate query parameters
router.get(
  "/properties/search",
  validateQuery(propertySearchSchema),
  propertyController.search
);
```

### 3. **Sử dụng trong controllers**

```typescript
import { RegisterInput } from '../validations';

async register(req: Request, res: Response) {
  // Data đã được validate và có type safety
  const validatedData = req.body as RegisterInput;
  const { fullName, email, password } = validatedData;

  // Không cần validation thủ công nữa!
  // ...logic xử lý
}
```

## 📁 **Cấu trúc files**

```
src/
├── validations/
│   ├── index.ts                 # Export tất cả
│   ├── common.ts               # Schemas dùng chung
│   ├── authValidation.ts       # Auth-related schemas
│   ├── propertyValidation.ts   # Property-related schemas
│   └── userValidation.ts       # User management schemas
├── middleware/
│   └── validation.ts           # Validation middleware
└── examples/
    ├── AuthControllerWithZod.ts # Example controller
    └── RoutesWithZod.ts        # Example routes
```

## 🛠️ **Available Schemas**

### **Auth Schemas:**

- `registerSchema` - Đăng ký user
- `loginSchema` - Đăng nhập
- `changePasswordSchema` - Đổi mật khẩu
- `updateProfileSchema` - Cập nhật profile

### **Post Schemas:**

- `createPostSchema` - Tạo bài đăng bất động sản
- `updatePostSchema` - Cập nhật bài đăng
- `postSearchSchema` - Tìm kiếm/filter bài đăng
- `postIdParamSchema` - Validate post ID
- `updatePostStatusSchema` - Cập nhật trạng thái bài đăng
- `resubmitPostSchema` - Gửi lại bài đăng để duyệt
- `extendPostSchema` - Gia hạn bài đăng
- `bulkPostActionSchema` - Thao tác hàng loạt

### **Property Schemas:**

- `createPropertySchema` - Tạo bất động sản
- `updatePropertySchema` - Cập nhật bất động sản
- `propertySearchSchema` - Tìm kiếm bất động sản
- `propertyIdParamSchema` - Validate property ID

### **User Schemas:**

- `updateUserProfileSchema` - Cập nhật profile user
- `userSearchSchema` - Tìm kiếm user
- `banUserSchema` - Cấm user

### **Common Schemas:**

- `emailSchema` - Validate email
- `passwordSchema` - Validate password
- `phoneSchema` - Validate phone
- `mongoIdSchema` - Validate MongoDB ID
- `paginationSchema` - Validate pagination

## 🔧 **Validation Middleware**

### **validateBody(schema)**

Validate request body

### **validateParams(schema)**

Validate URL parameters

### **validateQuery(schema)**

Validate query parameters

### **validateMultiple(schemas)**

Validate nhiều phần cùng lúc:

```typescript
validateMultiple({
  params: userIdParamSchema,
  body: updateUserSchema,
  query: paginationSchema,
});
```

## 📝 **Migration từ validation cũ**

### **Trước (validation thủ công):**

```typescript
async register(req: Request, res: Response) {
  const { email, password } = req.body;

  // Manual validation
  if (!email || !password) {
    return res.status(400).json({
      message: "Email và password là bắt buộc"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "Password phải có ít nhất 6 ký tự"
    });
  }

  // More validation...
}
```

### **Sau (với Zod):**

```typescript
// Route
router.post('/register',
  validateBody(registerSchema),
  authController.register
);

// Controller
async register(req: Request, res: Response) {
  // Data đã được validate!
  const { email, password } = req.body as RegisterInput;

  // Chỉ cần business logic
}
```

## ⚡ **Ưu điểm**

1. **Type Safety**: Automatic TypeScript types
2. **Consistent Errors**: Unified error format
3. **Reusable**: Schemas có thể dùng lại
4. **Maintainable**: Centralized validation logic
5. **Vietnamese**: Error messages tiếng Việt
6. **Performance**: Faster than manual validation

## 🚀 **Next Steps**

1. **Migration Plan**: Từ từ migrate các endpoints hiện tại
2. **Add More Schemas**: Tạo schemas cho các features mới
3. **Custom Validators**: Tạo custom validation rules
4. **Testing**: Write tests cho validation schemas

## 📚 **Resources**

- [Zod Documentation](https://zod.dev/)
- [Validation Examples](./examples/)
- [Schema Reference](./validations/)

---

🎯 **Ready to use!** Bắt đầu bằng cách apply vào 1-2 endpoints test, sau đó migrate dần toàn bộ dự án.
