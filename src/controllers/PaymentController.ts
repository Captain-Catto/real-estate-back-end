import { Response } from "express";
import { Payment, Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import {
  getVnpayConfig,
  generateOrderId,
  createVNPaySecureHash,
  verifyVNPaySecureHash,
  buildVNPayUrl,
  sanitizeOrderInfo,
  formatVNPayAmount,
  parseVNPayAmount,
  getVNPayTimestamp,
  getClientIp,
  VNPayParams,
} from "../utils/payment";
import mongoose from "mongoose";

export class PaymentController {
  /**
   * Tạo URL thanh toán VNPay
   */
  async createVNPayPaymentUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount, orderInfo, postId, returnUrl } = req.body;
      const vnpayConfig = getVnpayConfig();

      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });
      if (!amount || amount <= 0)
        return res.status(400).json({
          success: false,
          message: "Amount is required and must be greater than 0",
        });

      if (postId) {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid post ID format" });
        }
        const post = await Post.findById(postId);
        if (!post)
          return res
            .status(404)
            .json({ success: false, message: "Post not found" });
      }

      // Generate unique order ID
      const orderId = generateOrderId();
      const vnpTxnRef = `${orderId}_${getVNPayTimestamp()}`;

      // Create payment record
      const payment = new Payment({
        userId,
        postId: postId || null,
        orderId,
        amount,
        currency: "VND",
        paymentMethod: "vnpay",
        status: "pending",
        description: sanitizeOrderInfo(
          orderInfo || "Payment for real estate service"
        ),
        vnpayTransactionRef: vnpTxnRef,
        returnUrl: returnUrl || vnpayConfig.returnUrl,
        ipnUrl: vnpayConfig.ipnUrl,
      });

      await payment.save();

      if (!vnpayConfig.tmnCode || !vnpayConfig.hashSecret) {
        return res.status(500).json({
          success: false,
          message:
            "VNPAY configuration is missing. Please check environment variables.",
        });
      }

      // Build VNPAY parameters
      const vnpParams: VNPayParams = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnpayConfig.tmnCode,
        vnp_Locale: "vn",
        vnp_CurrCode: "VND",
        vnp_TxnRef: vnpTxnRef,
        vnp_OrderInfo: payment.description,
        vnp_OrderType: "other",
        vnp_Amount: formatVNPayAmount(amount).toString(),
        vnp_ReturnUrl: payment.returnUrl!,
        vnp_IpAddr: getClientIp(req),
        vnp_CreateDate: getVNPayTimestamp(),
      };

      // Create secure hash
      vnpParams.vnp_SecureHash = createVNPaySecureHash(
        vnpParams,
        vnpayConfig.hashSecret!
      );
      // Build payment URL
      const paymentUrl = buildVNPayUrl(vnpParams);

      // Update payment record with URL
      payment.paymentUrl = paymentUrl;
      await payment.save();

      res.status(200).json({
        success: true,
        message: "Payment URL created successfully",
        data: {
          paymentUrl,
          orderId,
          amount,
          description: payment.description,
        },
      });
    } catch (error) {
      console.error("Error creating VNPAY payment URL:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Xử lý callback trả về từ VNPay
   */
  async processVNPayReturn(req: AuthenticatedRequest, res: Response) {
    try {
      const vnpParamsRaw = req.query;
      const vnpParams: Record<string, string> = {};
      Object.keys(vnpParamsRaw).forEach((key) => {
        const value = vnpParamsRaw[key];
        vnpParams[key] = Array.isArray(value)
          ? (value[0] as string)
          : (value as string);
      });
      const secureHash = vnpParams.vnp_SecureHash as string;
      const vnpayConfig = getVnpayConfig();

      if (!secureHash)
        return res
          .status(400)
          .json({ success: false, message: "Missing security hash" });
      if (
        !verifyVNPaySecureHash(vnpParams, secureHash, vnpayConfig.hashSecret!)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid signature" });
      }

      const vnpTxnRef = vnpParams.vnp_TxnRef as string;
      const vnpResponseCode = vnpParams.vnp_ResponseCode as string;
      const vnpTransactionStatus = vnpParams.vnp_TransactionStatus as string;
      const vnpAmount = parseVNPayAmount(Number(vnpParams.vnp_Amount));
      const vnpTransactionNo = vnpParams.vnp_TransactionNo as string;
      const vnpPayDate = vnpParams.vnp_PayDate as string;

      const payment = await Payment.findOne({ vnpayTransactionRef: vnpTxnRef });
      if (!payment)
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });

      if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
        payment.status = "completed";
        payment.transactionId = vnpTransactionNo;
        payment.completedAt = new Date();
        payment.paymentDate = new Date(
          vnpPayDate.replace(
            /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
            "$1-$2-$3T$4:$5:$6"
          )
        );
        payment.metadata = {
          ...payment.metadata,
          vnpResponseCode,
          vnpTransactionStatus,
          vnpTransactionNo,
          vnpPayDate,
        };
      } else {
        payment.status = "failed";
        payment.failedAt = new Date();
        payment.metadata = {
          ...payment.metadata,
          vnpResponseCode,
          vnpTransactionStatus,
          failureReason: this.getVNPayErrorMessage(vnpResponseCode),
        };
      }

      await payment.save();

      res.json({
        success: payment.status === "completed",
        message:
          payment.status === "completed"
            ? "Payment completed successfully"
            : "Payment failed",
        data: {
          orderId: payment.orderId,
          amount: vnpAmount,
          status: payment.status,
          transactionId: vnpTransactionNo,
          paymentDate: payment.paymentDate,
        },
      });
    } catch (error) {
      console.error("Error processing VNPAY return:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Xử lý IPN từ VNPay (server-to-server notify)
   */
  async processVNPayIPN(req: AuthenticatedRequest, res: Response) {
    try {
      const vnpParamsRaw = req.query;
      const vnpParams: Record<string, string> = {};
      Object.keys(vnpParamsRaw).forEach((key) => {
        const value = vnpParamsRaw[key];
        vnpParams[key] = Array.isArray(value)
          ? (value[0] as string)
          : (value as string);
      });
      const secureHash = vnpParams.vnp_SecureHash as string;
      const vnpayConfig = getVnpayConfig();

      // Remove hash fields for verification
      const verifyParams = { ...vnpParams };
      delete verifyParams.vnp_SecureHash;
      delete verifyParams.vnp_SecureHashType;

      if (
        !secureHash ||
        !verifyVNPaySecureHash(vnpParams, secureHash, vnpayConfig.hashSecret!)
      ) {
        return res
          .status(200)
          .json({ RspCode: "97", Message: "Checksum failed" });
      }

      const orderId = vnpParams.vnp_TxnRef;
      const rspCode = vnpParams.vnp_ResponseCode;
      const vnpAmount = parseVNPayAmount(Number(vnpParams.vnp_Amount));

      // Kiểm tra đơn hàng trong DB
      const payment = await Payment.findOne({ vnpayTransactionRef: orderId });
      if (!payment) {
        return res
          .status(200)
          .json({ RspCode: "01", Message: "Order not found" });
      }

      // Kiểm tra số tiền
      if (payment.amount !== vnpAmount) {
        return res
          .status(200)
          .json({ RspCode: "04", Message: "Amount invalid" });
      }

      // Kiểm tra trạng thái giao dịch
      if (payment.status === "completed" || payment.status === "failed") {
        return res.status(200).json({
          RspCode: "02",
          Message: "This order has been updated to the payment status",
        });
      }

      // Cập nhật trạng thái giao dịch
      if (rspCode === "00") {
        payment.status = "completed";
        payment.transactionId = vnpParams.vnp_TransactionNo;
        payment.completedAt = new Date();
        payment.paymentDate = new Date();
      } else {
        payment.status = "failed";
        payment.failedAt = new Date();
      }
      payment.metadata = { ...payment.metadata, ...vnpParams };
      await payment.save();

      return res.status(200).json({ RspCode: "00", Message: "Success" });
    } catch (error) {
      console.error("VNPay IPN error:", error);
      return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
    }
  }

  /**
   * Lấy lịch sử giao dịch của user
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });

      const payments = await Payment.find({ userId })
        .populate("postId", "title description price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPayments = await Payment.countDocuments({ userId });

      res.json({
        success: true,
        data: {
          payments,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalPayments / limit),
            totalItems: totalPayments,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error getting payment history:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Lấy chi tiết giao dịch theo orderId
   */
  async getPaymentDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { orderId } = req.params;

      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });

      const payment = await Payment.findOne({ orderId, userId }).populate(
        "postId",
        "title description price"
      );
      if (!payment)
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });

      res.json({ success: true, data: { payment } });
    } catch (error) {
      console.error("Error getting payment details:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Kiểm tra trạng thái giao dịch
   */
  async checkPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const payment = await Payment.findOne({ orderId });
      if (!payment)
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });

      res.json({
        success: true,
        data: {
          orderId: payment.orderId,
          status: payment.status,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          failedAt: payment.failedAt,
        },
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Mapping mã lỗi VNPAY sang thông báo tiếng Việt
   */
  private getVNPayErrorMessage(responseCode: string): string {
    const errorMessages: { [key: string]: string } = {
      "01": "Giao dịch chưa hoàn tất",
      "02": "Giao dịch bị lỗi",
      "04": "Giao dịch đảo (Khách hàng đã bị trừ tiền tại Ngân hàng nhưng GD chưa thành công ở VNPAY)",
      "05": "VNPAY đang xử lý giao dịch này (GD hoàn tiền)",
      "06": "VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)",
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "GD Hoàn trả bị từ chối",
      "10": "Đã giao hàng",
      "20": "Đã hoàn tiền",
      "21": "Hoàn tiền bị từ chối",
      "22": "Giao dịch chưa được thanh toán",
      default: "Giao dịch thất bại",
    };

    return errorMessages[responseCode] || errorMessages["default"];
  }
}
