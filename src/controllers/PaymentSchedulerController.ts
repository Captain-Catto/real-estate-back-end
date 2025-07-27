import { Request, Response } from "express";
import { paymentScheduler } from "../services/paymentScheduler";
import { Payment } from "../models/Payment";

export class PaymentSchedulerController {
  /**
   * Lấy thống kê giao dịch sắp hết hạn
   */
  static async getExpiringPaymentsStats(req: Request, res: Response) {
    try {
      const stats = await paymentScheduler.getExpiringPayments();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error getting expiring payments stats:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Chạy thủ công việc hủy giao dịch quá hạn
   */
  static async cancelExpiredPaymentsNow(req: Request, res: Response) {
    try {
      const result = await paymentScheduler.cancelExpiredPaymentsNow();

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          cancelledCount: result.cancelledCount,
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      console.error("Error cancelling expired payments:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Lấy danh sách giao dịch pending sắp hết hạn
   */
  static async getPendingPayments(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Lấy giao dịch pending
      const pendingPayments = await Payment.find({
        status: "pending",
      })
        .populate("userId", "username email")
        .populate("postId", "title")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const totalPending = await Payment.countDocuments({
        status: "pending",
      });

      // Phân loại theo thời gian
      const categorizedPayments = pendingPayments.map((payment) => {
        const timeElapsed = now.getTime() - payment.createdAt.getTime();
        const hoursElapsed = timeElapsed / (1000 * 60 * 60);

        let category = "normal";
        let timeRemaining = 24 - hoursElapsed;

        if (hoursElapsed >= 24) {
          category = "expired";
          timeRemaining = 0;
        } else if (hoursElapsed >= 18) {
          category = "expiring_soon"; // Còn < 6 giờ
        } else if (hoursElapsed >= 12) {
          category = "expiring"; // Còn < 12 giờ
        }

        return {
          ...payment.toObject(),
          category,
          hoursElapsed: Math.floor(hoursElapsed),
          timeRemaining: Math.max(0, Math.floor(timeRemaining)),
        };
      });

      res.json({
        success: true,
        data: {
          payments: categorizedPayments,
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(totalPending / limitNum),
            totalItems: totalPending,
            itemsPerPage: limitNum,
          },
        },
      });
    } catch (error) {
      console.error("Error getting pending payments:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }

  /**
   * Hủy thủ công một giao dịch cụ thể
   */
  static async cancelPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;
      const { reason = "Hủy thủ công bởi admin" } = req.body;

      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: "Payment not found",
        });
      }

      if (payment.status !== "pending") {
        return res.status(400).json({
          success: false,
          error: `Cannot cancel payment with status: ${payment.status}`,
        });
      }

      payment.status = "cancelled";
      payment.cancelledAt = new Date();
      payment.cancelReason = reason;

      await payment.save();

      res.json({
        success: true,
        message: "Payment cancelled successfully",
        data: payment,
      });
    } catch (error) {
      console.error("Error cancelling payment:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
