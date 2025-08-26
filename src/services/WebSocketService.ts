import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verifyAccessToken, TokenPayload } from "../utils/auth";
import { BlacklistedToken } from "../models/BlacklistedToken";
import { User } from "../models/User";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: TokenPayload;
}

export interface WalletUpdateEvent {
  userId: string;
  balance: number;
  totalIncome: number;
  totalSpending: number;
  bonusEarned: number;
  lastTransaction: Date;
}

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

export interface PaymentStatusChangeEvent {
  userId: string;
  payment: {
    orderId: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
  };
}

export interface NotificationUpdateEvent {
  userId: string;
  notification: {
    id: string;
    title: string;
    message: string;
    type: 'PAYMENT' | 'POST_PAYMENT' | 'POST_APPROVED' | 'POST_REJECTED' | 'POST_EXPIRED' | 'PACKAGE_PURCHASE' | 'SYSTEM' | 'INTEREST';
    read: boolean;
    createdAt: Date;
    data?: any;
  };
}

export class WebSocketService {
  private static instance: WebSocketService;
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, AuthenticatedSocket>();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public initialize(httpServer: HttpServer): void {
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

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log("🔌 WebSocket service initialized");
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Extract token from handshake auth or query
        const token = socket.handshake.auth?.token || socket.handshake.query?.token as string;
        
        if (!token) {
          console.log("🚫 WebSocket connection rejected: No token provided");
          return next(new Error("Authentication failed: No token provided"));
        }

        // Check if token is blacklisted
        const blacklistedToken = await BlacklistedToken.findOne({ token });
        if (blacklistedToken) {
          console.log("🚫 WebSocket connection rejected: Token blacklisted");
          return next(new Error("Authentication failed: Token has been invalidated"));
        }

        // Verify JWT token
        const decoded = verifyAccessToken(token);
        
        // Check if user exists and is not banned
        const user = await User.findById(decoded.userId);
        if (!user) {
          console.log("🚫 WebSocket connection rejected: User not found");
          return next(new Error("Authentication failed: User not found"));
        }

        if (user.status === "banned") {
          console.log(`🚫 WebSocket connection rejected: User ${user.email} is banned`);
          return next(new Error("Authentication failed: User is banned"));
        }

        // Attach user info to socket
        socket.userId = decoded.userId;
        socket.user = decoded;
        
        console.log(`✅ WebSocket authenticated: ${decoded.email} (${decoded.userId})`);
        next();
      } catch (error) {
        console.log("🚫 WebSocket authentication error:", error instanceof Error ? error.message : "Unknown error");
        next(new Error("Authentication failed: Invalid token"));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const userEmail = socket.user?.email;
      
      console.log(`🔗 WebSocket connected: ${userEmail} (${userId})`);

      // Store connection
      this.connectedUsers.set(userId, socket);

      // Join user-specific room
      socket.join(`user:${userId}`);
      socket.join("wallet-updates"); // Global wallet updates room

      // Handle wallet subscription
      socket.on("wallet:subscribe", () => {
        socket.join(`wallet:${userId}`);
        console.log(`💰 User ${userEmail} subscribed to wallet updates`);
        
        // Send acknowledgment
        socket.emit("wallet:subscribed", {
          success: true,
          message: "Subscribed to wallet updates"
        });
      });

      // Handle wallet unsubscribe
      socket.on("wallet:unsubscribe", () => {
        socket.leave(`wallet:${userId}`);
        console.log(`💰 User ${userEmail} unsubscribed from wallet updates`);
        
        socket.emit("wallet:unsubscribed", {
          success: true,
          message: "Unsubscribed from wallet updates"
        });
      });

      // Handle manual sync request
      socket.on("wallet:request-sync", async () => {
        console.log(`🔄 Manual wallet sync requested by ${userEmail}`);
        
        // Emit a trigger for wallet refresh
        socket.emit("wallet:sync-requested", {
          timestamp: new Date().toISOString(),
          message: "Manual sync triggered"
        });
      });

      // Handle heartbeat/ping
      socket.on("ping", (callback) => {
        if (typeof callback === "function") {
          callback("pong");
        }
      });

      // Handle disconnect
      socket.on("disconnect", (reason) => {
        console.log(`🔌 WebSocket disconnected: ${userEmail} (${reason})`);
        this.connectedUsers.delete(userId);
      });

      // Send initial connection success
      socket.emit("connected", {
        success: true,
        userId,
        timestamp: new Date().toISOString(),
        message: "WebSocket connection established"
      });
    });
  }

  // Emit wallet balance update to specific user
  public emitWalletUpdate(walletData: WalletUpdateEvent): void {
    if (!this.io) {
      console.warn("⚠️ WebSocket not initialized, cannot emit wallet update");
      return;
    }

    const { userId } = walletData;
    
    // Emit to user-specific room
    this.io.to(`wallet:${userId}`).emit("wallet:balance-updated", walletData);
    
    console.log(`💰 Emitted wallet update to user ${userId}: balance=${walletData.balance}`);
  }

  // Emit transaction completion to specific user
  public emitTransactionCompleted(transactionData: TransactionCompletedEvent): void {
    if (!this.io) {
      console.warn("⚠️ WebSocket not initialized, cannot emit transaction completed");
      return;
    }

    const { userId } = transactionData;
    
    this.io.to(`wallet:${userId}`).emit("wallet:transaction-completed", transactionData);
    
    console.log(`💳 Emitted transaction completed to user ${userId}: ${transactionData.transaction.orderId}`);
  }

  // Emit payment status change to specific user
  public emitPaymentStatusChange(paymentData: PaymentStatusChangeEvent): void {
    if (!this.io) {
      console.warn("⚠️ WebSocket not initialized, cannot emit payment status change");
      return;
    }

    const { userId } = paymentData;
    
    this.io.to(`wallet:${userId}`).emit("wallet:payment-status-changed", paymentData);
    
    console.log(`💸 Emitted payment status change to user ${userId}: ${paymentData.payment.orderId} -> ${paymentData.payment.status}`);
  }

  // Emit notification update to specific user
  public emitNotificationUpdate(notificationData: NotificationUpdateEvent): void {
    if (!this.io) {
      console.warn("⚠️ WebSocket not initialized, cannot emit notification update");
      return;
    }

    const { userId } = notificationData;
    
    // Emit to user-specific room
    this.io.to(`user:${userId}`).emit("notification:new", notificationData);
    
    console.log(`🔔 Emitted notification update to user ${userId}: ${notificationData.notification.type} - ${notificationData.notification.title}`);
  }

  // Get connected user count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get connected users list (for debugging)
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Broadcast to all connected users (admin function)
  public broadcastToAll(event: string, data: any): void {
    if (!this.io) {
      console.warn("⚠️ WebSocket not initialized, cannot broadcast");
      return;
    }

    this.io.emit(event, data);
    console.log(`📢 Broadcasted ${event} to all connected users`);
  }

  // Get server instance (for testing)
  public getServer(): SocketIOServer | null {
    return this.io;
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();