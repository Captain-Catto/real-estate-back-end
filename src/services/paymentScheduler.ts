import { Payment } from "../models/Payment";

export class PaymentScheduler {
  private static instance: PaymentScheduler;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60 * 60 * 1000; // Kiểm tra mỗi 1 giờ

  private constructor() {}

  public static getInstance(): PaymentScheduler {
    if (!PaymentScheduler.instance) {
      PaymentScheduler.instance = new PaymentScheduler();
    }
    return PaymentScheduler.instance;
  }

  /**
   * Bắt đầu scheduler để tự động hủy các giao dịch pending quá 1 ngày
   */
  public start(): void {
    if (this.intervalId) {
      console.log("Payment scheduler is already running");
      return;
    }

    console.log("Starting payment scheduler...");

    // Chạy ngay lần đầu
    this.cancelExpiredPayments();

    // Sau đó chạy mỗi 1 giờ
    this.intervalId = setInterval(() => {
      this.cancelExpiredPayments();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Dừng scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("Payment scheduler stopped");
    }
  }

  /**
   * Hủy các giao dịch pending quá 1 ngày
   */
  private async cancelExpiredPayments(): Promise<void> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: oneDayAgo },
      });

      if (expiredPayments.length === 0) {
        console.log("No expired pending payments found");
        return;
      }

      console.log(`Found ${expiredPayments.length} expired pending payments`);

      // Cập nhật trạng thái thành cancelled
      const result = await Payment.updateMany(
        {
          status: "pending",
          createdAt: { $lt: oneDayAgo },
        },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: "Tự động hủy do quá thời gian thanh toán (24 giờ)",
          },
        }
      );

      console.log(
        `Successfully cancelled ${result.modifiedCount} expired payments`
      );

      // Log chi tiết các giao dịch đã bị hủy
      for (const payment of expiredPayments) {
        console.log(
          `Cancelled payment: ${payment.orderId} - User: ${payment.userId} - Amount: ${payment.amount} VND`
        );
      }
    } catch (error) {
      console.error("Error cancelling expired payments:", error);
    }
  }

  /**
   * Kiểm tra và hủy ngay lập tức (để test hoặc chạy thủ công)
   */
  public async cancelExpiredPaymentsNow(): Promise<{
    success: boolean;
    cancelledCount: number;
    message: string;
  }> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: oneDayAgo },
      });

      if (expiredPayments.length === 0) {
        return {
          success: true,
          cancelledCount: 0,
          message: "No expired pending payments found",
        };
      }

      const result = await Payment.updateMany(
        {
          status: "pending",
          createdAt: { $lt: oneDayAgo },
        },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            cancelReason: "Tự động hủy do quá thời gian thanh toán (24 giờ)",
          },
        }
      );

      return {
        success: true,
        cancelledCount: result.modifiedCount,
        message: `Successfully cancelled ${result.modifiedCount} expired payments`,
      };
    } catch (error) {
      console.error("Error cancelling expired payments:", error);
      return {
        success: false,
        cancelledCount: 0,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Lấy thống kê các giao dịch sắp hết hạn
   */
  public async getExpiringPayments(): Promise<{
    expiredCount: number;
    expiringIn6Hours: number;
    expiringIn12Hours: number;
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sixHoursFromExpiry = new Date(now.getTime() - 18 * 60 * 60 * 1000);
      const twelveHoursFromExpiry = new Date(
        now.getTime() - 12 * 60 * 60 * 1000
      );

      const [expiredCount, expiringIn6Hours, expiringIn12Hours] =
        await Promise.all([
          Payment.countDocuments({
            status: "pending",
            createdAt: { $lt: oneDayAgo },
          }),
          Payment.countDocuments({
            status: "pending",
            createdAt: { $gte: oneDayAgo, $lt: sixHoursFromExpiry },
          }),
          Payment.countDocuments({
            status: "pending",
            createdAt: { $gte: sixHoursFromExpiry, $lt: twelveHoursFromExpiry },
          }),
        ]);

      return {
        expiredCount,
        expiringIn6Hours,
        expiringIn12Hours,
      };
    } catch (error) {
      console.error("Error getting expiring payments stats:", error);
      return {
        expiredCount: 0,
        expiringIn6Hours: 0,
        expiringIn12Hours: 0,
      };
    }
  }
}

export const paymentScheduler = PaymentScheduler.getInstance();
