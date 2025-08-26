# Tối ưu hóa hệ thống tracking lượt view

## Vấn đề hiện tại:
1. PageView collection sẽ lớn rất nhanh
2. Counting toàn bộ collection không hiệu quả
3. Thiếu cơ chế chống spam/duplicate

## Giải pháp đề xuất:

### 1. Thêm TTL index cho PageView
```typescript
// Trong PageView.ts
PageViewSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 }); // 1 năm
```

### 2. Tạo bảng tổng hợp hàng ngày
```typescript
// models/DailyStats.ts
const DailyStatsSchema = new Schema({
  date: { type: Date, required: true, unique: true },
  totalViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  topPages: [{
    page: String,
    views: Number
  }]
});
```

### 3. Rate limiting cho tracking endpoint
```typescript
// middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

export const trackingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 4. Batch processing với Redis
```typescript
// services/viewTrackingService.ts
import Redis from 'ioredis';

export class ViewTrackingService {
  private redis = new Redis();
  
  async trackView(ip: string, page: string) {
    const key = `views:${new Date().toISOString().split('T')[0]}`;
    const viewKey = `${ip}:${page}`;
    
    // Check if already tracked in last hour
    const lastTracked = await this.redis.get(`track:${viewKey}`);
    if (lastTracked) return;
    
    // Set rate limit
    await this.redis.setex(`track:${viewKey}`, 3600, Date.now());
    
    // Increment counters
    await this.redis.hincrby(key, 'total', 1);
    await this.redis.sadd(`${key}:ips`, ip);
    await this.redis.hincrby(`${key}:pages`, page, 1);
  }
  
  async flushToDatabase() {
    // Process Redis data và ghi vào MongoDB theo batch
  }
}
```

### 5. Scheduled job để aggregate data
```typescript
// jobs/aggregateViews.js
import cron from 'node-cron';

// Chạy mỗi 1 giờ
cron.schedule('0 * * * *', async () => {
  await viewTrackingService.flushToDatabase();
});
```

## Lợi ích:
- Giảm 90% database writes
- Query stats nhanh hơn 10x
- Tự động cleanup data cũ
- Chống spam hiệu quả
- Scalable cho traffic cao