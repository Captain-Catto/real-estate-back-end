import { Response } from "express";
import { Payment, Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import {
  vnpayConfig,
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
   * Create VNPAY payment URL
   */
  async createVNPayPaymentUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount, orderInfo, postId, returnUrl } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate required fields
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount is required and must be greater than 0",
        });
      }

      // Validate post if provided
      if (postId) {
        if (!mongoose.Types.ObjectId.isValid(postId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid post ID format",
          });
        }

        const post = await Post.findById(postId);
        if (!post) {
          return res.status(404).json({
            success: false,
            message: "Post not found",
          });
        }
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
        vnp_Amount: formatVNPayAmount(amount),
        vnp_ReturnUrl: payment.returnUrl!,
        vnp_IpAddr: getClientIp(req),
        vnp_CreateDate: getVNPayTimestamp(),
      };

      // Create secure hash
      const secureHash = createVNPaySecureHash(
        vnpParams,
        vnpayConfig.hashSecret
      );
      vnpParams.vnp_SecureHash = secureHash;

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
   * Process VNPAY payment return
   */
  async processVNPayReturn(req: AuthenticatedRequest, res: Response) {
    try {
      const vnpParams = req.query;
      const secureHash = vnpParams.vnp_SecureHash as string;

      console.log("VNPAY Return params:", vnpParams);

      if (!secureHash) {
        return res.status(400).json({
          success: false,
          message: "Missing security hash",
        });
      }

      // Verify secure hash
      if (
        !verifyVNPaySecureHash(vnpParams, secureHash, vnpayConfig.hashSecret)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid signature",
        });
      }

      // Extract order information
      const vnpTxnRef = vnpParams.vnp_TxnRef as string;
      const vnpResponseCode = vnpParams.vnp_ResponseCode as string;
      const vnpTransactionStatus = vnpParams.vnp_TransactionStatus as string;
      const vnpAmount = parseVNPayAmount(Number(vnpParams.vnp_Amount));
      const vnpTransactionNo = vnpParams.vnp_TransactionNo as string;
      const vnpPayDate = vnpParams.vnp_PayDate as string;

      // Find payment record
      const payment = await Payment.findOne({ vnpayTransactionRef: vnpTxnRef });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      // Update payment status based on response
      if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
        // Payment successful
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
        // Payment failed
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
   * Process VNPAY IPN (Instant Payment Notification)
   */
  async processVNPayIPN(req: AuthenticatedRequest, res: Response) {
    try {
      const vnpParams = req.query;
      const secureHash = vnpParams.vnp_SecureHash as string;

      console.log("VNPAY IPN params:", vnpParams);

      if (!secureHash) {
        return res.status(200).json({
          RspCode: "97",
          Message: "Missing secure hash",
        });
      }

      // Verify secure hash
      if (
        !verifyVNPaySecureHash(vnpParams, secureHash, vnpayConfig.hashSecret)
      ) {
        return res.status(200).json({
          RspCode: "97",
          Message: "Checksum failed",
        });
      }

      // Extract order information
      const vnpTxnRef = vnpParams.vnp_TxnRef as string;
      const vnpResponseCode = vnpParams.vnp_ResponseCode as string;
      const vnpTransactionStatus = vnpParams.vnp_TransactionStatus as string;
      const vnpAmount = parseVNPayAmount(Number(vnpParams.vnp_Amount));
      const vnpTransactionNo = vnpParams.vnp_TransactionNo as string;

      // Find payment record
      const payment = await Payment.findOne({ vnpayTransactionRef: vnpTxnRef });

      if (!payment) {
        return res.status(200).json({
          RspCode: "01",
          Message: "Order not found",
        });
      }

      // Check if payment is already processed
      if (payment.status !== "pending") {
        return res.status(200).json({
          RspCode: "02",
          Message: "Order already confirmed",
        });
      }

      // Update payment status
      if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
        payment.status = "completed";
        payment.transactionId = vnpTransactionNo;
        payment.completedAt = new Date();
      } else {
        payment.status = "failed";
        payment.failedAt = new Date();
      }

      await payment.save();

      res.status(200).json({
        RspCode: "00",
        Message: "success",
      });
    } catch (error) {
      console.error("Error processing VNPAY IPN:", error);
      res.status(200).json({
        RspCode: "99",
        Message: "Unknown error",
      });
    }
  }

  /**
   * Get payment history for authenticated user
   */
  async getPaymentHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

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
   * Get payment details by order ID
   */
  async getPaymentDetails(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { orderId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const payment = await Payment.findOne({ orderId, userId }).populate(
        "postId",
        "title description price"
      );

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      res.json({
        success: true,
        data: {
          payment,
        },
      });
    } catch (error) {
      console.error("Error getting payment details:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.params;

      const payment = await Payment.findOne({ orderId });

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

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
   * Get VNPAY error message
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
