# Real Estate Backend API

> RESTful API backend cho nền tảng bất động sản được xây dựng với Node.js, Express, TypeScript và MongoDB.

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cài đặt](#-cài-đặt)
- [Scripts](#-scripts)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API Endpoints](#-api-endpoints)
- [Environment Variables](#-environment-variables)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Permissions System](#-permissions-system)
- [Payment Integration](#-payment-integration)
- [File Upload](#-file-upload)
- [Validation](#-validation)
- [Deployment](#-deployment)

## 🔍 Tổng quan

Backend API cho hệ thống quản lý bất động sản, cung cấp:

- RESTful API endpoints
- JWT authentication & authorization
- Hệ thống phân quyền chi tiết
- Tích hợp thanh toán VNPay
- Upload file lên AWS S3
- Validation với Zod
- Scheduled tasks với node-cron
- Email service với Nodemailer

## 🚀 Công nghệ sử dụng

### Core Technologies

- **Node.js** - JavaScript runtime
- **Express 4.17.1** - Web framework
- **TypeScript 4.5.2** - Type safety
- **MongoDB 6.17.0** - NoSQL database
- **Mongoose 7.0.0** - ODM for MongoDB

### Authentication & Security

- **jsonwebtoken 9.0.0** - JWT tokens
- **bcrypt 5.1.1** - Password hashing
- **cookie-parser 1.4.7** - Cookie parsing
- **cors 2.8.5** - CORS handling

### Validation & Processing

- **Zod 3.25.76** - Schema validation
- **multer 1.4.5** - File upload handling
- **multer-s3 2.10.0** - S3 integration

### External Services

- **aws-sdk 2.1692.0** - AWS services
- **nodemailer 7.0.5** - Email service
- **node-cron 4.2.1** - Scheduled tasks
- **date-fns 4.1.0** - Date manipulation

### AI & Utilities

- **@ai-sdk/groq 1.2.9** - AI integration
- **ai 4.3.16** - AI utilities
- **uuid 11.1.0** - UUID generation
- **@faker-js/faker 9.9.0** - Test data generation

### Development Tools

- **ts-node 10.4.0** - TypeScript execution
- **nodemon 3.1.10** - Development server

## 📦 Cài đặt

### Yêu cầu hệ thống

- Node.js >= 18.0.0
- MongoDB >= 5.0.0
- npm hoặc yarn

### Cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd real-estate-back-end

# Cài đặt dependencies
npm install
```

### Thiết lập Environment Variables

Tạo file `.env` trong thư mục root:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/real-estate
DB_NAME=real-estate

# Server
PORT=8080
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-s3-bucket

# VNPay
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/thanh-toan/ket-qua

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000

# API Keys
GROQ_API_KEY=your-groq-api-key
```

## 🛠 Scripts

```bash
# Development
npm run dev         # Khởi động development server với ts-node (port 8081)

# Production
npm run build       # Compile TypeScript to dist/
npm start          # Khởi động production server từ dist/

```

## 📁 Cấu trúc dự án

```
real-estate-back-end/
├── src/
│   ├── app.ts                 # Entry point
│   ├── controllers/           # Request handlers
│   │   ├── AuthController.ts  # Authentication
│   │   ├── PostController.ts  # Property posts
│   │   ├── UserController.ts  # User management
│   │   ├── AdminController.ts # Admin operations
│   │   ├── PaymentController.ts # Payment handling
│   │   └── LocationController.ts # Location data
│   ├── models/                # Mongoose schemas
│   │   ├── User.ts           # User model
│   │   ├── Post.ts           # Property post model
│   │   ├── Payment.ts        # Payment model
│   │   ├── Location.ts       # Location model
│   │   └── Permission.ts     # Permission model
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── permissions.ts   # Permission checks
│   │   ├── validation.ts    # Request validation
│   │   └── upload.ts        # File upload
│   ├── routes/              # Route definitions
│   │   └── index.ts         # Main router
│   ├── services/            # Business logic
│   │   ├── AuthService.ts   # Authentication logic
│   │   ├── PaymentService.ts # Payment processing
│   │   ├── EmailService.ts  # Email handling
│   │   └── NotificationService.ts # Notifications
│   ├── utils/               # Utility functions
│   │   ├── database.ts      # DB connection
│   │   ├── logger.ts        # Logging
│   │   └── helpers.ts       # Helper functions
│   ├── validations/         # Zod schemas
│   │   ├── authValidation.ts
│   │   ├── postValidation.ts
│   │   └── userValidation.ts
│   ├── types/               # TypeScript types
│   └── constants/           # Application constants
├── scripts/                 # Setup & utility scripts
├── docs/                   # API documentation
├── .env                    # Environment variables
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project dependencies
```

## 🔗 API Endpoints

### Authentication

```
POST   /api/auth/register     # Đăng ký người dùng
POST   /api/auth/login        # Đăng nhập
POST   /api/auth/refresh      # Refresh token
POST   /api/auth/logout       # Đăng xuất
POST   /api/auth/forgot       # Quên mật khẩu
POST   /api/auth/reset        # Đặt lại mật khẩu
```

### Users

```
GET    /api/users            # Lấy danh sách người dùng (Admin)
GET    /api/users/:id        # Lấy thông tin người dùng
PUT    /api/users/:id        # Cập nhật thông tin
DELETE /api/users/:id        # Xóa người dùng (Admin)
PUT    /api/users/:id/role   # Thay đổi vai trò (Admin)
```

### Posts (Properties)

```
GET    /api/posts            # Lấy danh sách tin đăng
POST   /api/posts            # Tạo tin đăng mới
GET    /api/posts/:id        # Lấy chi tiết tin đăng
PUT    /api/posts/:id        # Cập nhật tin đăng
DELETE /api/posts/:id        # Xóa tin đăng
POST   /api/posts/search     # Tìm kiếm tin đăng
PUT    /api/posts/:id/status # Cập nhật trạng thái (Admin)
```

### Payments

```
POST   /api/payments/vnpay/create    # Tạo thanh toán VNPay
GET    /api/payments/vnpay/return    # Xử lý kết quả VNPay
GET    /api/payments/history         # Lịch sử giao dịch
GET    /api/wallet/balance           # Số dư ví
```

### Locations

```
GET    /api/locations/provinces      # Danh sách tỉnh/thành
GET    /api/locations/wards/:code    # Danh sách phường/xã
GET    /api/locations/names          # Chuyển đổi code thành tên
```

### Admin

```
GET    /api/admin/stats             # Thống kê tổng quan
GET    /api/admin/dashboard         # Dữ liệu dashboard
GET    /api/admin/users             # Quản lý người dùng
GET    /api/admin/posts             # Quản lý tin đăng
```

## 🔐 Environment Variables

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/real-estate
DB_NAME=real-estate

# Server Configuration
PORT=8081
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=your-s3-bucket

# VNPay Configuration
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3000/thanh-toan/ket-qua

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# AI Services
GROQ_API_KEY=your-groq-api-key
```

## 🗄 Database Schema

### Collections

- **users** - Người dùng và thông tin tài khoản
- **posts** - Tin đăng bất động sản
- **payments** - Giao dịch thanh toán
- **locations** - Dữ liệu địa điểm
- **permissions** - Hệ thống phân quyền
- **contacts** - Yêu cầu liên hệ
- **packages** - Gói dịch vụ đăng tin

### Relationships

- Users có nhiều Posts (1:N)
- Posts thuộc về User (N:1)
- Users có nhiều Payments (1:N)
- Posts có Location (N:1)

## 🔐 Authentication

### JWT Implementation

```typescript
// Middleware xác thực
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};
```

### Token Management

- **Access Token**: 15 phút (trong header)
- **Refresh Token**: 7 ngày (trong HTTP-only cookie)
- Auto refresh khi access token hết hạn

## 🛡 Permissions System

### Role-based Access Control

```typescript
// Kiểm tra quyền
const requirePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.userId).populate("permissions");

    if (user.hasPermission(permission)) {
      next();
    } else {
      res.status(403).json({ message: "Insufficient permissions" });
    }
  };
};
```

### Permission Categories

- **users**: create, read, update, delete
- **posts**: create, read, update, delete, approve
- **payments**: view, process, refund
- **admin**: dashboard, analytics, system

## 💳 Payment Integration

### VNPay Integration

```typescript
// Tạo URL thanh toán
const createPaymentUrl = (amount: number, orderInfo: string) => {
  const vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_Amount: amount * 100,
    vnp_CreateDate: moment().format("YYYYMMDDHHmmss"),
    vnp_CurrCode: "VND",
    vnp_OrderInfo: orderInfo,
    vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
  };

  return createVNPayUrl(vnp_Params);
};
```

### Payment Flow

1. User chọn gói dịch vụ
2. Tạo payment record trong DB
3. Redirect đến VNPay
4. User thanh toán
5. VNPay callback với kết quả
6. Cập nhật payment status
7. Cập nhật wallet balance

## 📁 File Upload

### AWS S3 Integration

```typescript
// Multer S3 configuration
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.S3_BUCKET_NAME!,
    key: (req, file, cb) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      cb(null, `uploads/${fileName}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
```

### Supported File Types

- Images: JPG, PNG, WebP
- Documents: PDF
- Max size: 5MB per file

## ✅ Validation

### Zod Schema Validation

```typescript
// Post validation schema
const createPostSchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50),
  price: z.number().positive(),
  area: z.number().positive(),
  location: z.object({
    province: z.string(),
    ward: z.string(),
    street: z.string().optional(),
  }),
  type: z.enum(["ban", "cho-thue"]),
});
```

### Validation Middleware

- Request body validation
- Parameter validation
- Query validation
- File validation

## 🚢 Deployment

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Environment Setup

1. Configure production database
2. Set up AWS S3 bucket
3. Configure VNPay production credentials
4. Set up email service
5. Configure reverse proxy (Nginx)
6. Enable HTTPS
7. Set up process manager (PM2)

### PM2 Configuration

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/app.js --name "real-estate-api"

# Save configuration
pm2 save
pm2 startup
```

### Health Checks

```typescript
// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

## 📊 Monitoring

### Logging

- Request/Response logging
- Error tracking
- Performance monitoring
- Database query logging

### Metrics

- API response times
- Database performance
- Error rates
- User activity

## 🔧 Development Guidelines

### Code Style

- TypeScript strict mode
- ESLint configuration
- Consistent naming conventions
- Error handling patterns

### Best Practices

- Input validation with Zod
- Proper error handling
- Database indexing
- Security headers
- Rate limiting

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB connection**: Check MONGODB_URI
2. **JWT errors**: Verify JWT_SECRET
3. **File upload fails**: Check AWS credentials
4. **Payment errors**: Verify VNPay configuration

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Roadmap

- [ ] Redis caching
- [ ] Elasticsearch integration
- [ ] GraphQL API
- [ ] Microservices architecture
- [ ] Docker containerization
- [ ] API rate limiting
- [ ] Real-time notifications with WebSocket

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow coding guidelines
4. Add tests for new features
5. Submit pull request

## 📄 License

This project is proprietary software. All rights reserved.
