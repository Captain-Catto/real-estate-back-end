import cron from "node-cron";
import { Payment } from "../models/Payment";

export class PaymentCleanupService {
  private static instance: PaymentCleanupService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): PaymentCleanupService {
    if (!PaymentCleanupService.instance) {
      PaymentCleanupService.instance = new PaymentCleanupService();
    }
    return PaymentCleanupService.instance;
  }

  /**
   * Khởi tạo scheduled job để tự động hủy giao dịch quá hạn
   * Chạy mỗi giờ để kiểm tra và hủy các giao dịch pending quá 24 giờ
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.log("PaymentCleanupService đã được khởi tạo trước đó");
      return;
    }

    // Chạy mỗi giờ vào phút thứ 0
    cron.schedule("0 * * * *", async () => {
      await this.cancelExpiredPayments();
    });

    // Chạy ngay khi khởi động để xử lý các giao dịch đã quá hạn
    setTimeout(() => {
      this.cancelExpiredPayments();
    }, 5000); // Delay 5 giây sau khi khởi động

    this.isInitialized = true;
    console.log("✅ PaymentCleanupService đã được khởi tạo - sẽ chạy mỗi giờ");
  }

  /**
   * Hủy các giao dịch pending quá 24 giờ
   */
  public async cancelExpiredPayments(): Promise<{
    success: boolean;
    cancelledCount: number;
    error?: string;
  }> {
    try {
      console.log("🔍 Đang kiểm tra giao dịch quá hạn...");

      // Tính thời gian 24 giờ trước
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Tìm các giao dịch pending quá 24 giờ
      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: twentyFourHoursAgo },
      }).select("orderId amount description createdAt userId");

      if (expiredPayments.length === 0) {
        console.log("✅ Không có giao dịch nào cần hủy");
        return {
          success: true,
          cancelledCount: 0,
        };
      }

      console.log(`📋 Tìm thấy ${expiredPayments.length} giao dịch quá hạn:`);
      expiredPayments.forEach((payment) => {
        console.log(
          `  - OrderID: ${payment.orderId}, Amount: ${payment.amount}VND, Created: ${payment.createdAt}`
        );
      });

      // Cập nhật trạng thái thành cancelled
      const updateResult = await Payment.updateMany(
        {
          status: "pending",
          createdAt: { $lt: twentyFourHoursAgo },
        },
        {
          $set: {
            status: "cancelled",
            updatedAt: new Date(),
            cancelledAt: new Date(),
            cancelReason: "Tự động hủy sau 24 giờ không thanh toán",
          },
        }
      );

      console.log(
        `✅ Đã hủy thành công ${updateResult.modifiedCount} giao dịch quá hạn`
      );

      return {
        success: true,
        cancelledCount: updateResult.modifiedCount,
      };
    } catch (error) {
      console.error("❌ Lỗi khi hủy giao dịch quá hạn:", error);
      return {
        success: false,
        cancelledCount: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Dừng tất cả scheduled jobs
   */
  public destroy(): void {
    cron.getTasks().forEach((task) => {
      task.destroy();
    });
    this.isInitialized = false;
    console.log("PaymentCleanupService đã được dừng");
  }

  /**
   * Lấy thống kê về giao dịch quá hạn mà chưa được hủy
   */
  public async getExpiredPaymentsStats(): Promise<{
    totalExpired: number;
    totalAmount: number;
    oldestExpired?: Date;
  }> {
    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const expiredPayments = await Payment.find({
        status: "pending",
        createdAt: { $lt: twentyFourHoursAgo },
      }).select("amount createdAt");

      const totalAmount = expiredPayments.reduce(
        (sum, payment) => sum + payment.amount,
        0
      );

      const oldestExpired =
        expiredPayments.length > 0
          ? expiredPayments.reduce(
              (oldest, payment) =>
                payment.createdAt < oldest ? payment.createdAt : oldest,
              expiredPayments[0].createdAt
            )
          : undefined;

      return {
        totalExpired: expiredPayments.length,
        totalAmount,
        oldestExpired,
      };
    } catch (error) {
      console.error("Lỗi khi lấy thống kê giao dịch quá hạn:", error);
      return {
        totalExpired: 0,
        totalAmount: 0,
      };
    }
  }
}

// Export singleton instance
export const paymentCleanupService = PaymentCleanupService.getInstance();
