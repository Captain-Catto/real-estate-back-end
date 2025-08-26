# Socket.IO - Hệ Thống Giao Tiếp Thời Gian Thực

## Tổng Quan

Socket.IO là một thư viện JavaScript cho phép giao tiếp thời gian thực hai chiều giữa client và server. Trong hệ thống bất động sản, Socket.IO được sử dụng để cung cấp các tính năng cập nhật theo thời gian thực như:

- Cập nhật số dư ví điện tử
- Thông báo giao dịch hoàn thành
- Thông báo trạng thái thanh toán thay đổi
- Thông báo hệ thống
- Ping/Pong heartbeat

## Kiến Trúc Hệ Thống

### 1. WebSocketService (Singleton Pattern)

```typescript
export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, AuthenticatedSocket>();
}
```

**Đặc điểm:**
- Sử dụng Singleton Pattern để đảm bảo chỉ có một instance duy nhất
- Quản lý danh sách người dùng đã kết nối
- Cung cấp các phương thức emit sự kiện đến người dùng cụ thể

### 2. Cấu Hình Server

```typescript
this.io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",")
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"],
  allowEIO3: true
});
```

**Cấu hình quan trọng:**
- CORS được cấu hình để cho phép frontend kết nối
- Hỗ trợ cả websocket và polling transport
- Tương thích với Engine.IO v3

## Xác Thực (Authentication)

### Middleware Xác Thực

```typescript
this.io.use(async (socket: AuthenticatedSocket, next) => {
  try {
    // 1. Lấy token từ handshake
    const token = socket.handshake.auth?.token || 
                 socket.handshake.query?.token as string;
    
    // 2. Kiểm tra token có tồn tại
    if (!token) {
      return next(new Error("Authentication failed: No token provided"));
    }
    
    // 3. Kiểm tra token có bị blacklist
    const blacklistedToken = await BlacklistedToken.findOne({ token });
    if (blacklistedToken) {
      return next(new Error("Authentication failed: Token has been invalidated"));
    }
    
    // 4. Xác thực JWT token
    const decoded = verifyAccessToken(token);
    
    // 5. Kiểm tra user có tồn tại và không bị ban
    const user = await User.findById(decoded.userId);
    if (!user || user.status === "banned") {
      return next(new Error("Authentication failed: User not found or banned"));
    }
    
    // 6. Gán thông tin user vào socket
    socket.userId = decoded.userId;
    socket.user = decoded;
    
    next();
  } catch (error) {
    next(new Error("Authentication failed: Invalid token"));
  }
});
```

### Cách Kết Nối Từ Client

**JavaScript/TypeScript:**
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:8081', {
  auth: {
    token: 'your-jwt-token-here'
  },
  // Hoặc sử dụng query parameter
  query: {
    token: 'your-jwt-token-here'
  }
});
```

## Quản Lý Kết Nối

### Sự Kiện Connection

```typescript
this.io.on("connection", (socket: AuthenticatedSocket) => {
  const userId = socket.userId!;
  const userEmail = socket.user?.email;
  
  console.log(`🔗 WebSocket connected: ${userEmail} (${userId})`);
  
  // 1. Lưu kết nối vào Map
  this.connectedUsers.set(userId, socket);
  
  // 2. Tham gia các room cần thiết
  socket.join(`user:${userId}`);           // Room cá nhân
  socket.join("wallet-updates");           // Room cập nhật ví chung
  
  // 3. Gửi thông báo kết nối thành công
  socket.emit("connected", {
    success: true,
    userId,
    timestamp: new Date().toISOString(),
    message: "WebSocket connection established"
  });
});
```

### Quản Lý Room

**Room Types:**
- `user:${userId}` - Room cá nhân cho mỗi user
- `wallet:${userId}` - Room cập nhật ví cho user cụ thể
- `wallet-updates` - Room chung cho tất cả cập nhật ví

## Các Sự Kiện (Events)

### 1. Wallet Events

#### Subscribe/Unsubscribe Wallet Updates
```typescript
// Client đăng ký nhận thông báo ví
socket.on("wallet:subscribe", () => {
  socket.join(`wallet:${userId}`);
  socket.emit("wallet:subscribed", {
    success: true,
    message: "Subscribed to wallet updates"
  });
});

// Client hủy đăng ký
socket.on("wallet:unsubscribe", () => {
  socket.leave(`wallet:${userId}`);
  socket.emit("wallet:unsubscribed", {
    success: true,
    message: "Unsubscribed from wallet updates"
  });
});
```

#### Request Manual Sync
```typescript
socket.on("wallet:request-sync", async () => {
  socket.emit("wallet:sync-requested", {
    timestamp: new Date().toISOString(),
    message: "Manual sync triggered"
  });
});
```

### 2. Heartbeat/Ping
```typescript
socket.on("ping", (callback) => {
  if (typeof callback === "function") {
    callback("pong");
  }
});
```

### 3. Disconnect Event
```typescript
socket.on("disconnect", (reason) => {
  console.log(`🔌 WebSocket disconnected: ${userEmail} (${reason})`);
  this.connectedUsers.delete(userId);
});
```

## Emit Events Từ Server

### 1. Cập Nhật Số Dư Ví

```typescript
public emitWalletUpdate(walletData: WalletUpdateEvent): void {
  if (!this.io) return;
  
  const { userId } = walletData;
  
  // Gửi đến room cụ thể của user
  this.io.to(`wallet:${userId}`).emit("wallet:balance-updated", walletData);
}
```

**Interface WalletUpdateEvent:**
```typescript
export interface WalletUpdateEvent {
  userId: string;
  balance: number;
  totalIncome: number;
  totalSpending: number;
  bonusEarned: number;
  lastTransaction: Date;
}
```

### 2. Thông Báo Giao Dịch Hoàn Thành

```typescript
public emitTransactionCompleted(transactionData: TransactionCompletedEvent): void {
  const { userId } = transactionData;
  this.io.to(`wallet:${userId}`).emit("wallet:transaction-completed", transactionData);
}
```

**Interface TransactionCompletedEvent:**
```typescript
export interface TransactionCompletedEvent {
  userId: string;
  transaction: {
    orderId: string;
    amount: number;
    type: 'DEPOSIT' | 'PAYMENT' | 'REFUND' | 'BONUS';
    status: 'COMPLETED' | 'FAILED';
    description: string;
  };
}
```

### 3. Thay Đổi Trạng Thái Thanh Toán

```typescript
public emitPaymentStatusChange(paymentData: PaymentStatusChangeEvent): void {
  const { userId } = paymentData;
  this.io.to(`wallet:${userId}`).emit("wallet:payment-status-changed", paymentData);
}
```

### 4. Thông Báo Hệ Thống

```typescript
public emitNotificationUpdate(notificationData: NotificationUpdateEvent): void {
  const { userId } = notificationData;
  this.io.to(`user:${userId}`).emit("notification:new", notificationData);
}
```

### 5. Broadcast Đến Tất Cả User

```typescript
public broadcastToAll(event: string, data: any): void {
  if (!this.io) return;
  this.io.emit(event, data);
}
```

## Tích Hợp Với Controllers

### WalletController Integration

```typescript
import { webSocketService } from '../services/WebSocketService';

// Sau khi cập nhật ví thành công
const walletData = await UserWallet.findOne({ userId });
webSocketService.emitWalletUpdate({
  userId: userId.toString(),
  balance: walletData.balance,
  totalIncome: walletData.totalIncome,
  totalSpending: walletData.totalSpending,
  bonusEarned: walletData.bonusEarned,
  lastTransaction: new Date()
});
```

### PaymentController Integration

```typescript
// Sau khi hoàn thành giao dịch
webSocketService.emitTransactionCompleted({
  userId: payment.userId.toString(),
  transaction: {
    orderId: payment.orderId,
    amount: payment.amount,
    type: 'DEPOSIT',
    status: 'COMPLETED',
    description: 'Nạp tiền thành công'
  }
});
```

## Utility Methods

### Kiểm Tra User Online

```typescript
public isUserConnected(userId: string): boolean {
  return this.connectedUsers.has(userId);
}
```

### Lấy Thống Kê Kết Nối

```typescript
public getConnectedUsersCount(): number {
  return this.connectedUsers.size;
}

public getConnectedUsers(): string[] {
  return Array.from(this.connectedUsers.keys());
}
```

## Testing và Debug

### Test Endpoints

```typescript
// GET /api/test/websocket-status - Kiểm tra trạng thái WebSocket
router.get('/websocket-status', (req, res) => {
  const connectedUsers = webSocketService.getConnectedUsersCount();
  const server = webSocketService.getServer();
  
  res.json({
    success: true,
    data: {
      isInitialized: !!server,
      connectedUsers: connectedUsers,
      connectedUsersList: webSocketService.getConnectedUsers(),
      serverStatus: server ? 'running' : 'not initialized'
    }
  });
});

// POST /api/test/broadcast-test - Test broadcast message
router.post('/broadcast-test', (req, res) => {
  const { message } = req.body;
  
  webSocketService.broadcastToAll('test-broadcast', {
    message: message || 'Test broadcast message',
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Broadcast sent to all connected users'
  });
});
```

## Client-side Implementation

### Kết Nối và Lắng Nghe Events

```typescript
import io, { Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket | null = null;
  
  connect(token: string) {
    this.socket = io('http://localhost:8081', {
      auth: { token },
      transports: ['websocket', 'polling']
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    if (!this.socket) return;
    
    // Lắng nghe kết nối thành công
    this.socket.on('connected', (data) => {
      console.log('WebSocket connected:', data);
    });
    
    // Lắng nghe cập nhật ví
    this.socket.on('wallet:balance-updated', (data: WalletUpdateEvent) => {
      console.log('Wallet updated:', data);
      // Cập nhật UI
      this.updateWalletUI(data);
    });
    
    // Lắng nghe giao dịch hoàn thành
    this.socket.on('wallet:transaction-completed', (data: TransactionCompletedEvent) => {
      console.log('Transaction completed:', data);
      // Hiển thị thông báo
      this.showTransactionNotification(data);
    });
    
    // Lắng nghe thông báo mới
    this.socket.on('notification:new', (data: NotificationUpdateEvent) => {
      console.log('New notification:', data);
      // Cập nhật badge thông báo
      this.updateNotificationBadge(data);
    });
    
    // Xử lý lỗi kết nối
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });
    
    // Xử lý mất kết nối
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });
  }
  
  // Đăng ký nhận thông báo ví
  subscribeToWallet() {
    this.socket?.emit('wallet:subscribe');
  }
  
  // Hủy đăng ký thông báo ví
  unsubscribeFromWallet() {
    this.socket?.emit('wallet:unsubscribe');
  }
  
  // Yêu cầu đồng bộ ví thủ công
  requestWalletSync() {
    this.socket?.emit('wallet:request-sync');
  }
  
  // Heartbeat ping
  ping() {
    this.socket?.emit('ping', (response: string) => {
      console.log('Pong received:', response);
    });
  }
  
  // Ngắt kết nối
  disconnect() {
    this.socket?.disconnect();
  }
  
  private updateWalletUI(data: WalletUpdateEvent) {
    // Cập nhật số dư trên giao diện
    document.getElementById('wallet-balance')!.textContent = 
      new Intl.NumberFormat('vi-VN').format(data.balance) + ' VND';
  }
  
  private showTransactionNotification(data: TransactionCompletedEvent) {
    // Hiển thị toast notification
    const message = `Giao dịch ${data.transaction.orderId} ${
      data.transaction.status === 'COMPLETED' ? 'thành công' : 'thất bại'
    }`;
    
    // Toast notification library
    toast.success(message);
  }
  
  private updateNotificationBadge(data: NotificationUpdateEvent) {
    // Cập nhật số thông báo chưa đọc
    const badge = document.getElementById('notification-badge');
    if (badge) {
      const currentCount = parseInt(badge.textContent || '0');
      badge.textContent = (currentCount + 1).toString();
    }
  }
}

// Sử dụng
const wsClient = new WebSocketClient();
wsClient.connect('your-jwt-token');
wsClient.subscribeToWallet();
```

### React Hook Integration

```typescript
import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io, { Socket } from 'socket.io-client';

export const useWebSocket = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const connect = useCallback(() => {
    if (!accessToken || socket) return;
    
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    });
    
    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    });
    
    setSocket(newSocket);
  }, [accessToken, socket]);
  
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);
  
  const subscribeToWallet = useCallback(() => {
    if (socket) {
      socket.emit('wallet:subscribe');
    }
  }, [socket]);
  
  const emitEvent = useCallback((event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  }, [socket, isConnected]);
  
  const onEvent = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
      return () => socket.off(event, callback);
    }
  }, [socket]);
  
  useEffect(() => {
    if (accessToken) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [accessToken]);
  
  return {
    socket,
    isConnected,
    connect,
    disconnect,
    subscribeToWallet,
    emitEvent,
    onEvent
  };
};
```

## Error Handling và Reconnection

### Auto-reconnection Strategy

```typescript
class ReliableWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 giây
  
  connect(token: string) {
    this.socket = io('http://localhost:8081', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true
    });
    
    this.setupReconnectionHandlers();
  }
  
  private setupReconnectionHandlers() {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.reconnectAttempts = 0; // Reset attempts on successful connection
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('Connection failed:', error.message);
      this.handleReconnection();
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      
      // Auto-reconnect for certain reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't reconnect
        return;
      }
      
      this.handleReconnection();
    });
  }
  
  private handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }
}
```

## Performance và Optimization

### Connection Pooling

```typescript
// Giới hạn số kết nối đồng thời
const MAX_CONNECTIONS = 1000;
const connectionCount = new Map<string, number>(); // IP -> count

this.io.use((socket, next) => {
  const clientIP = socket.handshake.address;
  const currentConnections = connectionCount.get(clientIP) || 0;
  
  if (currentConnections >= 5) { // Tối đa 5 kết nối per IP
    return next(new Error('Too many connections from this IP'));
  }
  
  connectionCount.set(clientIP, currentConnections + 1);
  
  socket.on('disconnect', () => {
    const count = connectionCount.get(clientIP) || 0;
    if (count <= 1) {
      connectionCount.delete(clientIP);
    } else {
      connectionCount.set(clientIP, count - 1);
    }
  });
  
  next();
});
```

### Memory Management

```typescript
// Cleanup inactive connections
setInterval(() => {
  const now = Date.now();
  const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 phút
  
  this.connectedUsers.forEach((socket, userId) => {
    const lastActivity = socket.data?.lastActivity || now;
    
    if (now - lastActivity > INACTIVE_TIMEOUT) {
      console.log(`Disconnecting inactive user: ${userId}`);
      socket.disconnect(true);
      this.connectedUsers.delete(userId);
    }
  });
}, 5 * 60 * 1000); // Chạy mỗi 5 phút
```

## Monitoring và Logging

### Event Logging

```typescript
// Log tất cả events để debug
this.io.on('connection', (socket) => {
  const originalEmit = socket.emit.bind(socket);
  
  socket.emit = function(event: string, ...args: any[]) {
    console.log(`📤 Emitting ${event} to ${socket.userId}:`, args);
    return originalEmit(event, ...args);
  };
  
  const originalOn = socket.on.bind(socket);
  
  socket.on = function(event: string, listener: (...args: any[]) => void) {
    return originalOn(event, (...args: any[]) => {
      console.log(`📥 Received ${event} from ${socket.userId}:`, args);
      return listener(...args);
    });
  };
});
```

### Health Check

```typescript
// Health check endpoint
router.get('/websocket-health', (req, res) => {
  const server = webSocketService.getServer();
  const connectedUsers = webSocketService.getConnectedUsersCount();
  
  const health = {
    status: server ? 'healthy' : 'unhealthy',
    connectedUsers,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  res.json(health);
});
```

## Security Best Practices

### Rate Limiting

```typescript
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

this.io.use((socket, next) => {
  const userId = socket.userId;
  if (!userId) return next();
  
  const now = Date.now();
  const limit = rateLimiter.get(userId);
  
  if (limit) {
    if (now < limit.resetTime) {
      if (limit.count >= 100) { // 100 messages per minute
        return next(new Error('Rate limit exceeded'));
      }
      limit.count++;
    } else {
      rateLimiter.set(userId, { count: 1, resetTime: now + 60000 });
    }
  } else {
    rateLimiter.set(userId, { count: 1, resetTime: now + 60000 });
  }
  
  next();
});
```

### Input Validation

```typescript
socket.on('wallet:request-sync', (data) => {
  // Validate input data
  if (data && typeof data !== 'object') {
    socket.emit('error', { message: 'Invalid data format' });
    return;
  }
  
  // Process valid request
  socket.emit('wallet:sync-requested', {
    timestamp: new Date().toISOString(),
    message: 'Manual sync triggered'
  });
});
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:8081
   ```
   - Kiểm tra server có đang chạy không
   - Kiểm tra port number đúng chưa
   - Kiểm tra firewall settings

2. **Authentication Failed**
   ```
   Error: Authentication failed: No token provided
   ```
   - Đảm bảo token được truyền trong auth hoặc query
   - Kiểm tra token có hợp lệ và chưa expired
   - Kiểm tra token không bị blacklisted

3. **CORS Errors**
   ```
   Error: CORS error
   ```
   - Cấu hình CORS origin đúng trong server
   - Đảm bảo credentials: true nếu cần cookies

4. **Memory Leaks**
   - Implement cleanup logic cho event listeners
   - Remove disconnected users từ Map
   - Set timeout cho inactive connections

### Debug Tools

```typescript
// Enable Socket.IO debug logs
localStorage.debug = 'socket.io-client:socket';

// Monitor connection status
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', () => console.log('❌ Disconnected'));
socket.on('connect_error', (err) => console.log('🚫 Error:', err));

// Monitor all events
const originalEmit = socket.emit;
socket.emit = function(event, ...args) {
  console.log('📤 Emit:', event, args);
  return originalEmit.apply(socket, arguments);
};
```

## Best Practices

1. **Connection Management**
   - Implement exponential backoff cho reconnection
   - Cleanup event listeners khi component unmount
   - Sử dụng connection pooling cho high-traffic apps

2. **Event Design**
   - Sử dụng namespace rõ ràng cho events (wallet:, notification:)
   - Include timestamp trong tất cả events
   - Implement acknowledgments cho critical events

3. **Error Handling**
   - Always handle connection errors
   - Implement fallback cho khi WebSocket fail
   - Log errors với đủ context để debug

4. **Security**
   - Validate tất cả incoming data
   - Implement rate limiting
   - Regular token refresh mechanism
   - Monitor và log suspicious activities

5. **Performance**
   - Sử dụng rooms để target specific users
   - Avoid broadcasting unnecessary data
   - Implement connection limits
   - Monitor memory usage và cleanup inactive connections

Socket.IO cung cấp foundation mạnh mẽ cho real-time features trong ứng dụng bất động sản, cho phép users nhận updates ngay lập tức về ví điện tử, giao dịch, và thông báo hệ thống.