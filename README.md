# Backend Nền Tảng Bất Động Sản

Hệ thống backend RESTful API cho nền tảng bất động sản được xây dựng với Node.js, Express, TypeScript và MongoDB.

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cài Đặt](#-cài-đặt)
- [Cấu Hình Môi Trường](#-cấu-hình-môi-trường)
- [Lệnh Chạy](#-lệnh-chạy)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [API Endpoints](#-api-endpoints)
- [Xác Thực & Bảo Mật](#-xác-thực--bảo-mật)
- [Hệ Thống Phân Quyền](#-hệ-thống-phân-quyền)
- [Validation với Zod](#-validation-với-zod)
- [Tích Hợp Thanh Toán](#-tích-hợp-thanh-toán)
- [Upload File & AWS S3](#-upload-file--aws-s3)
- [WebSocket & Real-time](#-websocket--real-time)
- [Middleware System](#-middleware-system)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)

## 🏠 Giới Thiệu

Backend API cho hệ thống quản lý bất động sản với đầy đủ tính năng:

### Tính Năng Chính

- **RESTful API**: Endpoints chuẩn REST với HTTP status codes
- **Xác thực JWT**: Access token và refresh token với auto-renewal
- **Phân quyền chi tiết**: Role-based access control (RBAC)
- **Thanh toán VNPay**: Tích hợp cổng thanh toán VNPay
- **Upload AWS S3**: Lưu trữ hình ảnh và file trên Amazon S3
- **Real-time**: WebSocket cho thông báo và cập nhật trực tiếp
- **Validation**: Schema validation với Zod
- **Task Scheduling**: Tự động hóa với node-cron
- **Email Service**: Gửi email thông báo với Nodemailer

### Đối Tượng Người Dùng

- **Admin**: Quản lý toàn hệ thống
- **Employee**: Nhân viên với quyền hạn giới hạn
- **User**: Người dùng đăng tin và tìm kiếm bất động sản

## 🚀 Công Nghệ Sử Dụng

### Framework & Runtime

- **Node.js** v18+ - JavaScript runtime
- **Express.js** v4.17.1 - Web application framework
- **TypeScript** v4.5.2 - Type-safe JavaScript

### Database & ODM

- **MongoDB** v6.17.0 - NoSQL document database
- **Mongoose** v7.0.0 - MongoDB object modeling

### Xác Thực & Bảo Mật

- **jsonwebtoken** v9.0.0 - JWT token generation/verification
- **bcrypt** v5.1.1 - Password hashing
- **cors** v2.8.5 - Cross-Origin Resource Sharing
- **cookie-parser** v1.4.7 - HTTP cookie parsing

### Validation & Processing

- **Zod** v3.25.76 - TypeScript-first schema declaration
- **multer** v1.4.5 - File upload middleware
- **multer-s3** v2.10.0 - S3 storage engine for Multer

### Cloud Services & External APIs

- **aws-sdk** v2.1692.0 - Amazon Web Services SDK
- **nodemailer** v7.0.5 - Email sending library
- **date-fns** v4.1.0 - Date utility library

### Real-time & AI

- **socket.io** v4.8.1 - Real-time bidirectional communication
- **@ai-sdk/groq** v1.2.9 - AI integration with Groq

### Development Tools

- **ts-node** v10.4.0 - TypeScript execution for Node.js
- **nodemon** v3.1.10 - Auto-restart development server
- **node-cron** v4.2.1 - Task scheduling

## 📦 Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js** >= 18.0.0
- **MongoDB** >= 5.0.0
- **npm** hoặc **yarn**
- **AWS Account** (cho S3 storage)

### Các Bước Cài Đặt

```bash
# 1. Clone repository
git clone [repository-url]
cd real-estate-back-end

# 2. Cài đặt dependencies
npm install

# 3. Tạo file environment
cp .env.example .env

# 4. Cấu hình database
# Khởi động MongoDB service

# 5. Chạy migration (nếu có)
npm run migrate

# 6. Khởi động development server
npm run dev
```

## 🔧 Cấu Hình Môi Trường

Tạo file `.env` trong thư mục root với nội dung:

```bash
# ===== DATABASE CONFIGURATION =====
MONGODB_URI=mongodb://localhost:27017/real-estate
DB_NAME=real-estate

# ===== SERVER CONFIGURATION =====
PORT=8081
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ===== JWT AUTHENTICATION =====
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret-here
REFRESH_TOKEN_EXPIRES_IN=7d

# ===== AWS S3 CONFIGURATION =====
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-s3-bucket-name

# ===== VNPAY PAYMENT GATEWAY =====
VNPAY_TMN_CODE=your-vnpay-merchant-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/thanh-toan/ket-qua

# ===== EMAIL SERVICE (NODEMAILER) =====
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# ===== AI SERVICES =====
GROQ_API_KEY=your-groq-api-key
```

## 🛠 Lệnh Chạy

```bash
# Development - Chạy server với ts-node và nodemon
npm run dev

# Production Build - Compile TypeScript sang JavaScript
npm run build

# Production Start - Khởi động từ thư mục dist/
npm start

# Type Checking - Kiểm tra lỗi TypeScript
npx tsc --noEmit

# Database Migration
npm run migrate

# Seed Data - Tạo dữ liệu mẫu
npm run seed
```

## 📁 Cấu Trúc Dự Án

```
real-estate-back-end/
├── src/                        # Source code chính
│   ├── app.ts                  # Entry point - khởi tạo Express app
│   │
│   ├── controllers/            # Xử lý HTTP requests
│   │   ├── AuthController.ts   # Đăng nhập, đăng ký, xác thực
│   │   ├── PostController.ts   # CRUD tin đăng bất động sản
│   │   ├── UserController.ts   # Quản lý người dùng
│   │   ├── AdminController.ts  # Chức năng admin
│   │   ├── PaymentController.ts # Xử lý thanh toán VNPay
│   │   ├── WalletController.ts # Quản lý ví điện tử
│   │   ├── LocationController.ts # Dữ liệu địa danh
│   │   └── [...]Controller.ts  # Các controller khác
│   │
│   ├── models/                 # Mongoose schemas
│   │   ├── User.ts            # Schema người dùng
│   │   ├── Post.ts            # Schema tin đăng
│   │   ├── Payment.ts         # Schema giao dịch
│   │   ├── Permission.ts      # Schema phân quyền
│   │   └── [...]ts            # Các model khác
│   │
│   ├── middleware/            # Express middlewares
│   │   ├── auth.ts           # Xác thực JWT
│   │   ├── permissionMiddleware.ts # Kiểm tra quyền
│   │   ├── validation.ts     # Validation với Zod
│   │   └── middleware.ts     # Middleware tổng hợp
│   │
│   ├── routes/               # Định tuyến API
│   │   ├── index.ts         # Router chính
│   │   ├── authRoutes.ts    # Routes xác thực
│   │   ├── postRoutes.ts    # Routes tin đăng
│   │   ├── userRoutes.ts    # Routes người dùng
│   │   └── [...]Routes.ts   # Các routes khác
│   │
│   ├── services/            # Business logic
│   │   ├── WebSocketService.ts    # WebSocket real-time
│   │   ├── NotificationService.ts # Thông báo
│   │   ├── PaymentCleanupService.ts # Cleanup thanh toán
│   │   └── PostExpiryService.ts   # Hết hạn tin đăng
│   │
│   ├── validations/         # Zod validation schemas
│   │   ├── authValidation.ts    # Validation đăng nhập/ký
│   │   ├── postValidation.ts    # Validation tin đăng
│   │   ├── userValidation.ts    # Validation người dùng
│   │   └── common.ts           # Validation chung
│   │
│   ├── utils/               # Utility functions
│   │   ├── logger.ts        # Logging system
│   │   ├── emailService.ts  # Email utilities
│   │   ├── s3Upload.ts      # AWS S3 utilities
│   │   └── payment.ts       # Payment utilities
│   │
│   └── types/               # TypeScript type definitions
│       ├── index.ts         # Types chung
│       └── post.ts          # Types cho tin đăng
│
├── scripts/                 # Utility scripts
├── docs/                   # Documentation
├── .env                    # Environment variables
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies và scripts
```

## 🔗 API Endpoints

### Xác Thực (Authentication)

```http
POST   /api/auth/register      # Đăng ký tài khoản mới
POST   /api/auth/login         # Đăng nhập hệ thống
POST   /api/auth/refresh       # Làm mới access token
POST   /api/auth/logout        # Đăng xuất (blacklist token)
POST   /api/auth/forgot        # Quên mật khẩu
POST   /api/auth/reset         # Đặt lại mật khẩu
GET    /api/auth/verify        # Xác minh tài khoản
```

### Quản Lý Người Dùng (Users)

```http
GET    /api/users             # Danh sách người dùng (Admin)
GET    /api/users/:id         # Thông tin chi tiết người dùng
PUT    /api/users/:id         # Cập nhật thông tin
DELETE /api/users/:id         # Xóa tài khoản (Admin)
PUT    /api/users/:id/role    # Thay đổi vai trò (Admin)
PUT    /api/users/:id/permissions # Cập nhật quyền hạn
```

### Quản Lý Tin Đăng (Posts)

```http
GET    /api/posts             # Danh sách tin đăng (có phân trang)
POST   /api/posts             # Tạo tin đăng mới
GET    /api/posts/:id         # Chi tiết tin đăng
PUT    /api/posts/:id         # Cập nhật tin đăng
DELETE /api/posts/:id         # Xóa tin đăng
POST   /api/posts/search      # Tìm kiếm với filters
PUT    /api/posts/:id/status  # Cập nhật trạng thái (Admin)
PUT    /api/posts/:id/featured # Đặt tin nổi bật
GET    /api/posts/user/:userId # Tin đăng của user
```

### Thanh Toán (Payments)

```http
POST   /api/payments/vnpay/create    # Tạo link thanh toán VNPay
GET    /api/payments/vnpay/return    # Callback từ VNPay
POST   /api/payments/vnpay/ipn       # Instant Payment Notification
GET    /api/payments/history         # Lịch sử giao dịch
GET    /api/payments/:id             # Chi tiết giao dịch
POST   /api/payments/refund          # Hoàn tiền (Admin)
```

### Ví Điện Tử (Wallet)

```http
GET    /api/wallet/balance           # Số dư ví hiện tại
GET    /api/wallet/transactions      # Lịch sử giao dịch ví
POST   /api/wallet/withdraw          # Rút tiền
POST   /api/wallet/deposit           # Nạp tiền
```

### Địa Danh (Locations)

```http
GET    /api/locations/provinces      # Danh sách tỉnh/thành phố
GET    /api/locations/districts/:provinceCode # Quận/huyện theo tỉnh
GET    /api/locations/wards/:districtCode     # Phường/xã theo quận
GET    /api/locations/convert        # Chuyển đổi code sang tên
```

### Quản Trị (Admin)

```http
GET    /api/admin/dashboard          # Dữ liệu dashboard
GET    /api/admin/stats              # Thống kê tổng quan
GET    /api/admin/users              # Quản lý người dùng
GET    /api/admin/posts              # Quản lý tin đăng
GET    /api/admin/payments           # Quản lý giao dịch
POST   /api/admin/broadcast          # Gửi thông báo broadcast
```

## 🔐 Xác Thực & Bảo Mật

### JWT Token System

**Cấu trúc Token:**

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "employee" | "user";
  permissions: string[];
  iat: number;
  exp: number;
}
```

**Flow Xác Thực:**

1. User đăng nhập → Server tạo Access Token (15 phút) + Refresh Token (7 ngày)
2. Client gửi Access Token trong header `Authorization: Bearer <token>`
3. Middleware xác thực token trước mỗi request
4. Khi Access Token hết hạn → Client dùng Refresh Token để lấy token mới
5. Refresh Token được lưu trong HTTP-only cookie

### Middleware Xác Thực

```typescript
// middleware/auth.ts
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(403).json({ message: "Invalid token" });
  }
};
```

### Bảo Mật

- **Password Hashing**: bcrypt với salt rounds = 12
- **Token Blacklisting**: Blacklist JWT tokens khi logout
- **Rate Limiting**: Giới hạn số request per IP
- **CORS Configuration**: Cấu hình CORS cho domain cụ thể

## 🛡 Hệ Thống Phân Quyền

### Role-Based Access Control (RBAC)

**Cấu trúc Quyền:**

```typescript
interface Permission {
  resource: string; // 'users', 'posts', 'payments', etc.
  action: string; // 'create', 'read', 'update', 'delete'
  conditions?: object; // Điều kiện bổ sung
}

interface UserRole {
  name: "admin" | "employee" | "user";
  permissions: Permission[];
}
```

**Middleware Kiểm Tra Quyền:**

```typescript
export const requirePermission = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await User.findById(req.user.userId).populate("permissions");

      const hasPermission = user.permissions.some(
        (p) =>
          p.resource === resource && (p.action === action || p.action === "all")
      );

      if (hasPermission) {
        next();
      } else {
        res.status(403).json({ message: "Insufficient permissions" });
      }
    } catch (error) {
      res.status(500).json({ message: "Permission check failed" });
    }
  };
};
```

**Sử Dụng Middleware:**

```typescript
// Chỉ admin có thể xóa user
router.delete(
  "/users/:id",
  authenticateToken,
  requirePermission("users", "delete"),
  UserController.deleteUser
);

// Employee có thể duyệt post
router.put(
  "/posts/:id/approve",
  authenticateToken,
  requirePermission("posts", "approve"),
  PostController.approvePost
);
```

### Phân Cấp Quyền

- **Admin**: Toàn quyền hệ thống
- **Employee**: Quản lý content, duyệt tin
- **User**: Đăng tin cá nhân, quản lý tài khoản

## ✅ Validation với Zod

### Schema Definitions

```typescript
// validations/postValidation.ts
export const createPostSchema = z.object({
  title: z
    .string()
    .min(10, "Tiêu đề tối thiểu 10 ký tự")
    .max(200, "Tiêu đề tối đa 200 ký tự"),

  description: z.string().min(50, "Mô tả tối thiểu 50 ký tự"),

  price: z
    .number()
    .positive("Giá phải là số dương")
    .min(1000000, "Giá tối thiểu 1 triệu VND"),

  area: z.number().positive("Diện tích phải là số dương"),

  location: z.object({
    province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
    district: z.string().min(1, "Vui lòng chọn quận/huyện"),
    ward: z.string().min(1, "Vui lòng chọn phường/xã"),
    street: z.string().optional(),
    coordinates: z
      .object({
        lat: z.number(),
        lng: z.number(),
      })
      .optional(),
  }),

  type: z.enum(["ban", "cho-thue"], {
    errorMap: () => ({ message: "Loại tin phải là 'ban' hoặc 'cho-thue'" }),
  }),

  category: z.enum(["nha-dat", "can-ho", "van-phong"]),

  images: z.array(z.string().url()).optional(),

  features: z
    .object({
      bedrooms: z.number().min(0).optional(),
      bathrooms: z.number().min(0).optional(),
      parking: z.boolean().optional(),
      balcony: z.boolean().optional(),
    })
    .optional(),
});
```

### Validation Middleware

```typescript
// middleware/validation.ts
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData; // Gán data đã validate
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          message: "Validation failed",
          errors,
        });
      }
      next(error);
    }
  };
};

export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid parameters",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};
```

## 💳 Tích Hợp Thanh Toán

### VNPay Payment Gateway

**Tạo URL Thanh Toán:**

```typescript
// utils/payment.ts
export const createVNPayUrl = (params: VNPayParams): string => {
  const vnp_Params: any = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Amount: params.amount * 100, // VNPay tính bằng xu (x100)
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
    vnp_CurrCode: "VND",
    vnp_IpAddr: params.ipAddr,
    vnp_Locale: "vn",
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: "other",
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
    vnp_TxnRef: params.orderId,
  };

  // Sort params và tạo hash
  const sortedParams = sortObject(vnp_Params);
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", process.env.VNPAY_HASH_SECRET!);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;

  return (
    process.env.VNPAY_URL + "?" + qs.stringify(vnp_Params, { encode: false })
  );
};
```

**Payment Flow:**

1. User chọn gói dịch vụ → `POST /api/payments/vnpay/create`
2. Server tạo payment record với status 'pending'
3. Server tạo VNPay URL và trả về cho client
4. Client redirect user đến VNPay
5. User hoàn tất thanh toán trên VNPay
6. VNPay gọi callback → `GET /api/payments/vnpay/return`
7. Server verify hash, cập nhật payment status
8. Nếu thành công → cập nhật wallet balance
9. Redirect user về frontend với kết quả

**Payment Cleanup Service:**

```typescript
// services/PaymentCleanupService.ts
export class PaymentCleanupService {
  static async cleanupExpiredPayments() {
    const expiredTime = new Date(Date.now() - 15 * 60 * 1000); // 15 phút

    const expiredPayments = await Payment.find({
      status: "pending",
      createdAt: { $lt: expiredTime },
    });

    for (const payment of expiredPayments) {
      await Payment.findByIdAndUpdate(payment._id, {
        status: "expired",
        updatedAt: new Date(),
      });
    }
  }
}

// Chạy cleanup mỗi 10 phút
cron.schedule("*/10 * * * *", () => {
  PaymentCleanupService.cleanupExpiredPayments();
});
```

## 📁 Upload File & AWS S3

### Multer S3 Configuration

```typescript
// utils/s3Upload.ts
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

export const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${
        file.originalname
      }`;
      cb(null, `uploads/properties/${fileName}`);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10, // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ được upload file hình ảnh"), false);
    }
  },
});
```

**Upload Controller:**

```typescript
// controllers/UploadController.ts
export class UploadController {
  static uploadImages = [
    upload.array("images", 10),
    async (req: Request, res: Response) => {
      try {
        const files = req.files as Express.MulterS3.File[];

        if (!files || files.length === 0) {
          return res
            .status(400)
            .json({ message: "Không có file nào được upload" });
        }

        const imageUrls = files.map((file) => ({
          url: file.location,
          key: file.key,
          originalName: file.originalname,
          size: file.size,
        }));

        res.json({
          message: "Upload thành công",
          images: imageUrls,
        });
      } catch (error) {
        res
          .status(500)
          .json({ message: "Lỗi upload file", error: error.message });
      }
    },
  ];

  static deleteImage = async (req: Request, res: Response) => {
    try {
      const { key } = req.params;

      await s3
        .deleteObject({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: key,
        })
        .promise();

      res.json({ message: "Xóa file thành công" });
    } catch (error) {
      res.status(500).json({ message: "Lỗi xóa file", error: error.message });
    }
  };
}
```

## 🔄 WebSocket & Real-time

### Socket.IO Implementation

```typescript
// services/WebSocketService.ts
export class WebSocketService {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map();

  constructor(server: any) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST"],
      },
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.io.use(this.authenticateSocket);

    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.userId}`);
      this.connectedUsers.set(socket.userId, socket.id);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);

      // Join admin room if user is admin
      if (socket.userRole === "admin") {
        socket.join("admin_room");
      }

      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  private authenticateSocket = (socket: any, next: any) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  };

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  // Send notification to all admins
  sendToAdmins(event: string, data: any) {
    this.io.to("admin_room").emit(event, data);
  }

  // Broadcast to all connected users
  broadcast(event: string, data: any) {
    this.io.emit(event, data);
  }
}
```

### Real-time Events

```typescript
// Real-time notification events
export enum SocketEvents {
  // Post events
  POST_CREATED = "post:created",
  POST_UPDATED = "post:updated",
  POST_APPROVED = "post:approved",
  POST_REJECTED = "post:rejected",

  // Payment events
  PAYMENT_SUCCESS = "payment:success",
  PAYMENT_FAILED = "payment:failed",
  WALLET_UPDATED = "wallet:updated",

  // Admin events
  USER_REGISTERED = "user:registered",
  NEW_CONTACT = "contact:new",

  // System events
  MAINTENANCE_MODE = "system:maintenance",
}

// Usage in controllers
export class PostController {
  static async approvePost(req: Request, res: Response) {
    try {
      const post = await Post.findByIdAndUpdate(
        req.params.id,
        { status: "approved", approvedAt: new Date() },
        { new: true }
      ).populate("author");

      // Send real-time notification to post author
      WebSocketService.getInstance().sendToUser(
        post.author._id.toString(),
        SocketEvents.POST_APPROVED,
        {
          postId: post._id,
          title: post.title,
          message: "Tin đăng của bạn đã được duyệt",
        }
      );

      res.json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}
```

## ⚙️ Middleware System

### Middleware Pipeline

```typescript
// middleware/index.ts
export const setupMiddleware = (app: Express) => {
  // Basic middleware
  app.use(
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Custom middleware
  app.use(requestLogger);
  app.use(errorHandler);
  app.use(rateLimiter);
};

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );
  });

  next();
};

// Error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate field error",
      field: Object.keys(error.keyValue)[0],
    });
  }

  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
};

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Max 1000 requests per IP
  message: "Too many requests from this IP",
  standardHeaders: true,
  legacyHeaders: false,
});
```

## 🗄 Database Schema

### Core Collections

```typescript
// models/User.ts
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    role: {
      type: String,
      enum: ["admin", "employee", "user"],
      default: "user",
    },
    permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    wallet: {
      balance: { type: Number, default: 0 },
      currency: { type: String, default: "VND" },
    },
  },
  { timestamps: true }
);

// models/Post.ts
const postSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    content: { type: String },

    price: { type: Number, required: true },
    area: { type: Number, required: true },

    location: {
      province: { type: String, required: true },
      district: { type: String, required: true },
      ward: { type: String, required: true },
      street: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    type: {
      type: String,
      enum: ["ban", "cho-thue"],
      required: true,
    },

    category: {
      type: String,
      enum: ["nha-dat", "can-ho", "van-phong", "dat-nen"],
      required: true,
    },

    images: [
      {
        url: String,
        key: String,
        caption: String,
      },
    ],

    features: {
      bedrooms: { type: Number },
      bathrooms: { type: Number },
      parking: { type: Boolean },
      balcony: { type: Boolean },
      furnished: { type: Boolean },
    },

    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "expired"],
      default: "pending",
    },

    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    expiresAt: { type: Date },
    approvedAt: { type: Date },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// models/Payment.ts
const paymentSchema = new Schema(
  {
    orderId: { type: String, unique: true, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "VND" },

    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "banking"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed", "expired", "refunded"],
      default: "pending",
    },

    vnPayData: {
      transactionNo: String,
      responseCode: String,
      secureHash: String,
    },

    description: { type: String },
    packageId: { type: Schema.Types.ObjectId, ref: "Package" },
  },
  { timestamps: true }
);
```

### Indexes for Performance

```typescript
// Database indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ author: 1, status: 1 });
postSchema.index({ "location.province": 1, "location.district": 1 });
postSchema.index({ type: 1, category: 1 });
postSchema.index({ price: 1, area: 1 });
postSchema.index({ isFeatured: 1, status: 1 });

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ orderId: 1 });
```

## 🚢 Deployment

### Production Build

```bash
# 1. Build TypeScript
npm run build

# 2. Install production dependencies only
npm ci --production

# 3. Start with PM2
pm2 start ecosystem.config.js --env production
```

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "real-estate-api",
      script: "./dist/app.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "development",
        PORT: 8081,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
    },
  ],
};
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://mongo-cluster:27017/real-estate-prod
JWT_SECRET=super-secure-production-secret
AWS_REGION=ap-southeast-1
VNPAY_URL=https://vnpayment.vn/paymentv2/vpcpay.html
```

---

## 🤝 Đóng Góp (Contributing)

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Dự án này thuộc sở hữu riêng. Mọi quyền được bảo lưu.

## 📞 Hỗ Trợ

Nếu có thắc mắc hoặc cần hỗ trợ, vui lòng tạo issue trên GitHub repository.
