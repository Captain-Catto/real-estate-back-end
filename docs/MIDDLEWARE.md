# Tài Liệu Middleware System

Hệ thống middleware của nền tảng bất động sản cung cấp các lớp bảo mật, xác thực, phân quyền và validation cho API backend.

## 📋 Mục Lục

- [Tổng Quan](#tổng-quan)
- [Authentication Middleware](#authentication-middleware)
- [Permission Middleware](#permission-middleware)
- [Validation Middleware](#validation-middleware)
- [Middleware Pipeline](#middleware-pipeline)
- [Cách Sử Dụng](#cách-sử-dụng)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🔍 Tổng Quan

Middleware system được thiết kế theo nguyên tắc:

### Kiến Trúc Middleware
```
Request → Auth → Permission → Validation → Controller
```

### Các Layer Middleware
1. **Authentication Layer**: Xác thực người dùng qua JWT token
2. **Permission Layer**: Kiểm tra quyền hạn truy cập
3. **Validation Layer**: Validate dữ liệu đầu vào với Zod
4. **Error Handling Layer**: Xử lý lỗi thống nhất

### File Structure
```
src/middleware/
├── auth.ts              # Authentication middleware
├── permissionMiddleware.ts # Permission checking
├── validation.ts        # Data validation with Zod
├── middleware.ts        # General middleware utilities
└── index.ts            # Middleware exports
```

## 🔐 Authentication Middleware

### Tổng Quan

Authentication middleware (`auth.ts`) cung cấp hệ thống xác thực thống nhất với các tính năng:

- JWT token verification
- Token blacklist checking
- User status validation (banned/active)
- Role-based access control
- Flexible authentication options

### Core Functions

#### `authenticate(options: AuthOptions)`

Middleware chính cho xác thực với các tùy chọn:

```typescript
interface AuthOptions {
  requireAuth?: boolean;        // Bắt buộc đăng nhập
  requireAdmin?: boolean;       // Chỉ admin được truy cập
  requirePermissions?: string[]; // Danh sách quyền yêu cầu
  requireAnyPermission?: boolean; // Chỉ cần 1 trong các quyền
}
```

**Ví dụ sử dụng:**

```typescript
// Basic authentication - chỉ cần token hợp lệ
app.get('/api/profile', authenticate({ requireAuth: true }), ProfileController.get);

// Admin only
app.delete('/api/users/:id', authenticate({ requireAdmin: true }), UserController.delete);

// Specific permission required
app.get('/api/stats', authenticate({ 
  requirePermissions: ['view_statistics'] 
}), StatsController.get);

// Any of multiple permissions
app.put('/api/posts/:id', authenticate({ 
  requirePermissions: ['edit_posts', 'moderate_content'],
  requireAnyPermission: true 
}), PostController.update);

// Optional auth - user info if present
app.get('/api/posts', authenticate({ requireAuth: false }), PostController.list);
```

#### Token Extraction

Middleware hỗ trợ 2 cách gửi token:

```typescript
// 1. Authorization header (khuyến nghị)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// 2. HTTP-only cookie
Cookie: accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Flow Xác Thực

```mermaid
graph TD
    A[Request] --> B[Extract Token]
    B --> C{Token Present?}
    C -->|No| D{Auth Required?}
    D -->|Yes| E[401 Unauthorized]
    D -->|No| F[Continue]
    C -->|Yes| G[Check Blacklist]
    G --> H{Token Blacklisted?}
    H -->|Yes| I[401 Token Invalidated]
    H -->|No| J[Verify JWT]
    J --> K{Valid Token?}
    K -->|No| L[401 Invalid Token]
    K -->|Yes| M[Check User Status]
    M --> N{User Banned?}
    N -->|Yes| O[403 User Banned]
    N -->|No| P[Check Role/Permissions]
    P --> Q{Has Required Access?}
    Q -->|No| R[403 Insufficient Permissions]
    Q -->|Yes| S[Continue to Controller]
```

### Convenience Middleware

Để thuận tiện, các middleware shortcut được cung cấp:

```typescript
// Basic user authentication
export const requireAuth = authenticate({ requireAuth: true });

// Admin authentication  
export const requireAdmin = authenticate({ requireAdmin: true });

// Single permission
export const requirePermission = (permission: string) =>
  authenticate({ requirePermissions: [permission] });

// All permissions required
export const requireAllPermissions = (permissions: string[]) =>
  authenticate({ requirePermissions: permissions });

// Any permission sufficient
export const requireAnyPermission = (permissions: string[]) =>
  authenticate({ requirePermissions: permissions, requireAnyPermission: true });

// Optional authentication
export const optionalAuth = authenticate({ requireAuth: false });
```

### Error Codes

Middleware trả về các error codes cụ thể:

| Code | Status | Mô Tả |
|------|--------|-------|
| `TOKEN_BLACKLISTED` | 401 | Token đã bị vô hiệu hóa |
| `TOKEN_EXPIRED` | 401 | Token đã hết hạn |
| `TOKEN_INVALID` | 401 | Token không hợp lệ |
| `INVALID_TOKEN` | 401 | Format token sai |
| `USER_BANNED` | 403 | Tài khoản bị khóa |

### Logging

Authentication middleware có logging chi tiết:

```typescript
// Token verification
console.log('🔍 Checking banned status for user:', decoded.userId);

// User status check
console.log('👤 User found in DB:', currentUser ? `${currentUser.email} - status: ${currentUser.status}` : 'Not found');

// Ban status
console.log('🚫 User is BANNED - blocking access');
console.log('✅ User is NOT banned - allowing access');

// Permission checks
console.log('🔍 Permission check for', req.user.email);
console.log('   - Required permissions:', requirePermissions.join(', '));
console.log('   - User permissions:', userPermission.permissions.join(', '));
```

## 🛡 Permission Middleware

### Tổng Quan

Permission middleware (`permissionMiddleware.ts`) cung cấp kiểm tra quyền chi tiết cho các hành động cụ thể.

### Core Functions

#### `hasPermission(req, res, next, requiredPermission)`

Kiểm tra một quyền cụ thể:

```typescript
export const hasPermission = async (
  req: AuthenticatedRequest,
  res: Response, 
  next: NextFunction,
  requiredPermission: string
) => {
  // Logic kiểm tra quyền
};
```

#### `requirePermission(permission: string)`

Factory function tạo middleware kiểm tra quyền:

```typescript
// Sử dụng trong routes
app.get('/api/admin/users', 
  requireAuth, 
  requirePermission('manage_users'), 
  AdminController.getUsers
);
```

#### `requireAllPermissions(permissions: string[])`

Yêu cầu tất cả các quyền trong danh sách:

```typescript
app.post('/api/admin/posts/feature',
  requireAuth,
  requireAllPermissions(['manage_posts', 'feature_content']),
  AdminController.featurePost
);
```

#### `requireAnyPermission(permissions: string[])`

Chỉ cần một trong các quyền:

```typescript
app.put('/api/posts/:id',
  requireAuth,
  requireAnyPermission(['edit_own_posts', 'edit_all_posts']),
  PostController.update
);
```

### Permission Logic

```typescript
// 1. Admin luôn có mọi quyền
if (req.user?.role === "admin") {
  return next();
}

// 2. User phải đăng nhập
if (!req.user) {
  return res.status(401).json({
    message: "Bạn cần đăng nhập để thực hiện hành động này"
  });
}

// 3. Lấy permissions từ database
const userPermission = await UserPermission.findOne({
  userId: req.user.userId
});

// 4. Kiểm tra quyền cụ thể
const hasRequiredPermissions = permissions.every(permission =>
  userPermission.permissions.includes(permission)
);
```

### Permission Types

Các quyền trong hệ thống:

#### User Management
- `manage_users` - Quản lý người dùng
- `view_users` - Xem danh sách người dùng
- `ban_users` - Khóa tài khoản người dùng
- `assign_roles` - Phân quyền cho người dùng

#### Content Management  
- `manage_posts` - Quản lý tin đăng
- `approve_posts` - Duyệt tin đăng
- `feature_content` - Đặt nội dung nổi bật
- `edit_all_posts` - Sửa tất cả tin đăng
- `edit_own_posts` - Chỉ sửa tin của mình

#### System Access
- `view_statistics` - Xem thống kê
- `view_dashboard` - Truy cập dashboard admin
- `manage_categories` - Quản lý danh mục
- `manage_locations` - Quản lý địa điểm

#### Financial
- `view_payments` - Xem giao dịch
- `manage_payments` - Quản lý thanh toán
- `process_refunds` - Xử lý hoàn tiền

### Error Messages

Permission middleware sử dụng message tiếng Việt:

```typescript
return res.status(403).json({
  success: false,
  message: "Bạn không có quyền thực hiện hành động này"
});

return res.status(403).json({
  success: false,
  message: "Bạn không có đủ quyền để thực hiện hành động này"
});
```

## ✅ Validation Middleware

### Tổng Quan

Validation middleware (`validation.ts`) sử dụng Zod để validate dữ liệu request với type safety.

### Core Functions

#### `validate(schema, property)`

Generic validation function:

```typescript
export const validate = (
  schema: z.ZodSchema,
  property: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req[property]);
      req[property] = validatedData; // Replace với validated data
      next();
    } catch (error) {
      // Xử lý Zod validation errors
    }
  };
};
```

#### Convenience Functions

```typescript
// Validate request body
export const validateBody = (schema: z.ZodSchema) => validate(schema, "body");

// Validate query parameters
export const validateQuery = (schema: z.ZodSchema) => validate(schema, "query");

// Validate route parameters
export const validateParams = (schema: z.ZodSchema) => validate(schema, "params");
```

#### `validateMultiple(schemas)`

Validate nhiều properties cùng lúc:

```typescript
export const validateMultiple = (schemas: {
  body?: z.ZodSchema;
  query?: z.ZodSchema; 
  params?: z.ZodSchema;
}) => {
  // Validate all specified properties
};
```

### Sử Dụng Với Zod Schemas

#### Basic Usage

```typescript
import { validateBody } from '../middleware/validation';
import { createPostSchema } from '../validations/postValidation';

// Validate request body
app.post('/api/posts', 
  requireAuth,
  validateBody(createPostSchema),
  PostController.create
);
```

#### Multiple Validation

```typescript
import { validateMultiple } from '../middleware/validation';
import { searchPostSchema, paginationSchema } from '../validations';

app.get('/api/posts/search',
  validateMultiple({
    body: searchPostSchema,
    query: paginationSchema
  }),
  PostController.search
);
```

#### Parameter Validation

```typescript
import { validateParams } from '../middleware/validation';

const idSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId")
});

app.get('/api/posts/:id',
  validateParams(idSchema),
  PostController.getById
);
```

### Error Handling

Validation middleware trả về error format thân thiện:

```typescript
// Success case
req.body = validatedData; // Data đã được validate và transform

// Error case
return res.status(400).json({
  success: false,
  message: "Tiêu đề tối thiểu 10 ký tự", // Main message cho toast
  errors: [
    {
      field: "title",
      message: "Tiêu đề tối thiểu 10 ký tự", 
      code: "too_small"
    },
    {
      field: "price",
      message: "Giá phải là số dương",
      code: "invalid_type"
    }
  ]
});
```

### Custom Error Messages

Zod schemas có thể custom error messages:

```typescript
const createPostSchema = z.object({
  title: z.string()
    .min(10, "Tiêu đề tối thiểu 10 ký tự")
    .max(200, "Tiêu đề tối đa 200 ký tự"),
  
  price: z.number({
    required_error: "Giá là bắt buộc",
    invalid_type_error: "Giá phải là số"
  })
  .positive("Giá phải là số dương")
  .min(1000000, "Giá tối thiểu 1 triệu VND"),
  
  location: z.object({
    province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
    district: z.string().min(1, "Vui lòng chọn quận/huyện"),
    ward: z.string().min(1, "Vui lòng chọn phường/xã")
  })
});
```

## ⚙️ Middleware Pipeline

### Request Flow

Typical middleware pipeline cho các endpoints:

```typescript
// Public endpoint - không cần auth
app.get('/api/posts', 
  optionalAuth,           // User info nếu có
  validateQuery(searchSchema),
  PostController.list
);

// User endpoint - cần đăng nhập
app.post('/api/posts',
  requireAuth,            // Xác thực user
  validateBody(createPostSchema),
  PostController.create
);

// Admin endpoint - cần quyền admin
app.delete('/api/posts/:id',
  requireAdmin,           // Admin only
  validateParams(idSchema),
  PostController.delete
);

// Permission-based endpoint
app.put('/api/posts/:id/approve',
  requireAuth,            // Phải đăng nhập
  requirePermission('approve_posts'), // Cần quyền duyệt
  validateParams(idSchema),
  PostController.approve
);

// Complex permissions
app.get('/api/admin/statistics',
  requireAuth,
  requireAllPermissions([
    'view_statistics',
    'view_dashboard'
  ]),
  validateQuery(statsQuerySchema),
  StatsController.get
);
```

### Error Handling Pipeline

```typescript
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  // Authentication errors
  if (error.code === 'TOKEN_EXPIRED') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Permission errors
  if (error.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập'
    });
  }
  
  // Validation errors được handle trong validation middleware
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Lỗi hệ thống'
  });
});
```

## 🎯 Cách Sử Dụng

### 1. Basic Authentication

```typescript
import { requireAuth, optionalAuth } from '../middleware/auth';

// Endpoint yêu cầu đăng nhập
app.get('/api/profile', requireAuth, UserController.getProfile);

// Endpoint không bắt buộc đăng nhập
app.get('/api/posts', optionalAuth, PostController.list);
```

### 2. Role-Based Access

```typescript
import { requireAdmin, requireAuth } from '../middleware/auth';

// Chỉ admin
app.get('/api/admin/dashboard', requireAdmin, AdminController.dashboard);

// User đã đăng nhập
app.post('/api/posts', requireAuth, PostController.create);
```

### 3. Permission-Based Access

```typescript
import { requirePermission, requireAllPermissions, requireAnyPermission } from '../middleware/auth';

// Một quyền cụ thể
app.get('/api/admin/users', 
  requirePermission('manage_users'), 
  AdminController.getUsers
);

// Tất cả các quyền
app.post('/api/admin/posts/feature',
  requireAllPermissions(['manage_posts', 'feature_content']),
  AdminController.featurePost
);

// Một trong các quyền
app.put('/api/posts/:id',
  requireAnyPermission(['edit_own_posts', 'edit_all_posts']),
  PostController.update
);
```

### 4. Data Validation

```typescript
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { createUserSchema, paginationSchema, idSchema } from '../validations';

app.post('/api/users',
  requireAdmin,
  validateBody(createUserSchema),
  UserController.create
);

app.get('/api/users',
  requireAdmin, 
  validateQuery(paginationSchema),
  UserController.list
);

app.get('/api/users/:id',
  requireAuth,
  validateParams(idSchema),
  UserController.getById
);
```

### 5. Complex Middleware Chains

```typescript
// Post creation với đầy đủ middleware
app.post('/api/posts',
  requireAuth,                    // Xác thực user
  requirePermission('create_posts'), // Kiểm tra quyền
  validateBody(createPostSchema), // Validate data
  PostController.create
);

// Admin statistics endpoint
app.get('/api/admin/stats',
  requireAdmin,                   // Admin only
  validateQuery(statsQuerySchema), // Validate query params
  AdminController.getStatistics
);

// File upload với permissions
app.post('/api/upload',
  requireAuth,
  requireAnyPermission(['upload_images', 'manage_media']),
  uploadMiddleware.single('image'),
  validateBody(uploadSchema),
  UploadController.uploadImage
);
```

## 💡 Best Practices

### 1. Middleware Order

Luôn tuân thủ thứ tự middleware:

```typescript
// ĐÚNG: Authentication → Permission → Validation → Business Logic
app.post('/api/posts',
  requireAuth,           // 1. Xác thực
  requirePermission('create_posts'), // 2. Kiểm tra quyền  
  validateBody(schema),  // 3. Validate data
  PostController.create  // 4. Business logic
);

// SAI: Không đúng thứ tự
app.post('/api/posts',
  validateBody(schema),  // Validate trước auth - không hiệu quả
  requireAuth,
  PostController.create
);
```

### 2. Error Messages

Sử dụng error messages tiếng Việt thân thiện:

```typescript
// ĐÚNG
return res.status(403).json({
  success: false,
  message: "Bạn không có quyền thực hiện hành động này"
});

// TRÁNH
return res.status(403).json({
  message: "Forbidden"
});
```

### 3. Permission Granularity

Thiết kế permissions chi tiết và linh hoạt:

```typescript
// ĐÚNG: Permissions chi tiết
const permissions = [
  'create_posts',
  'edit_own_posts', 
  'edit_all_posts',
  'delete_own_posts',
  'delete_all_posts',
  'approve_posts'
];

// TRÁNH: Permissions quá chung chung
const permissions = [
  'manage_posts'  // Quá rộng, khó kiểm soát
];
```

### 4. Schema Reuse

Tái sử dụng Zod schemas:

```typescript
// Base schemas
const basePostSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50),
  price: z.number().positive()
});

// Extended schemas
const createPostSchema = basePostSchema.extend({
  location: locationSchema,
  images: z.array(z.string().url())
});

const updatePostSchema = basePostSchema.partial();
```

### 5. Middleware Composition

Tạo reusable middleware combinations:

```typescript
// Common middleware chains
export const authenticatedUser = [requireAuth];
export const adminOnly = [requireAdmin];
export const postManagement = [requireAuth, requirePermission('manage_posts')];

// Sử dụng
app.get('/api/admin/posts', ...adminOnly, AdminController.getPosts);
app.put('/api/posts/:id', ...postManagement, PostController.update);
```

### 6. Logging & Monitoring

Log các action quan trọng:

```typescript
export const auditLogger = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log(`[AUDIT] ${action}:`, {
      user: req.user?.email,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    next();
  };
};

// Sử dụng
app.delete('/api/users/:id',
  requireAdmin,
  auditLogger('DELETE_USER'),
  UserController.delete
);
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Token Not Found

```
Error: Access denied. No token provided.
```

**Solutions:**
- Kiểm tra header `Authorization: Bearer <token>`
- Hoặc cookie `accessToken`
- Đảm bảo token được gửi đúng format

#### 2. Token Expired

```
Error: Token expired
```

**Solutions:**
- Implement token refresh logic
- Redirect user to login
- Check token expiration time

#### 3. Permission Denied

```
Error: You don't have required permissions for this action.
```

**Solutions:**
- Check user permissions in database
- Verify UserPermission collection
- Ensure permissions are assigned correctly

#### 4. Validation Errors

```
Error: Tiêu đề tối thiểu 10 ký tự
```

**Solutions:**
- Check Zod schema definitions
- Verify input data format
- Review custom error messages

### Debug Tips

#### 1. Enable Detailed Logging

```typescript
// Add to middleware for debugging
console.log('🔍 Auth Debug:', {
  headers: req.headers,
  cookies: req.cookies,
  user: req.user,
  permissions: await getUserPermissions(req.user?.userId)
});
```

#### 2. Test Permissions

```typescript
// Helper để test permissions
export const debugPermissions = async (userId: string) => {
  const userPermission = await UserPermission.findOne({ userId });
  console.log('User Permissions:', {
    userId,
    permissions: userPermission?.permissions || [],
    hasViewStats: userPermission?.permissions.includes('view_statistics')
  });
};
```

#### 3. Validate Schema Testing

```typescript
// Test schemas trong development
if (process.env.NODE_ENV === 'development') {
  console.log('Schema validation result:', schema.safeParse(testData));
}
```

### Performance Considerations

#### 1. Cache Permissions

```typescript
// Cache user permissions để tránh query database liên tục
const permissionCache = new Map();

export const getCachedPermissions = async (userId: string) => {
  if (permissionCache.has(userId)) {
    return permissionCache.get(userId);
  }
  
  const permissions = await UserPermission.findOne({ userId });
  permissionCache.set(userId, permissions, { ttl: 300 }); // 5 minutes
  return permissions;
};
```

#### 2. Optimize Validation

```typescript
// Chỉ validate fields cần thiết
const updatePostSchema = z.object({
  title: z.string().min(10).optional(),
  description: z.string().min(50).optional(),
  price: z.number().positive().optional()
}).refine(
  data => Object.keys(data).length > 0,
  "Ít nhất một field cần được cập nhật"
);
```

---

## 📞 Hỗ Trợ

Nếu có vấn đề với middleware system:

1. Check logs chi tiết trong console
2. Verify database permissions và user status
3. Test với Postman/curl để isolate issues
4. Review middleware order trong routes
5. Kiểm tra Zod schema definitions

**Note**: Luôn test middleware changes trong development environment trước khi deploy production.