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
import { Wallet } from "../models/Wallet";
import { NotificationService } from "../services/NotificationService";

export class PaymentController {
  /**
   * Tạo URL thanh toán VNPay
   */
  async createVNPayPaymentUrl(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount, orderInfo, postId, returnUrl } = req.body;
      const vnpayConfig = getVnpayConfig();

      console.log("🔍 Payment request received:", {
        amount,
        orderInfo,
        postId,
      });

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

      // Extract bonus from the order info if present
      // Extract bonus from the order info using a more robust regex pattern that handles currency formatting
      let bonus = 0;
      if (orderInfo && orderInfo.includes("tang")) {
        console.log("Extracted order info:", orderInfo);

        // First check for specific amount patterns
        if (orderInfo.includes("500.000")) {
          bonus = 50000; // Hard-coded value for 500k top-up
          console.log("Detected 500k top-up, setting bonus to 50,000 VND");
        } else if (orderInfo.includes("1.000.000")) {
          bonus = 100000; // Hard-coded value for 1M top-up
        } else if (orderInfo.includes("3.000.000")) {
          bonus = 300000; // Hard-coded value for 3M top-up
        } else if (orderInfo.includes("5.000.000")) {
          bonus = 500000; // Hard-coded value for 5M top-up
        } else {
          // Try to extract the bonus amount with a more robust regex
          const bonusMatch = orderInfo.match(/tang\s+([0-9.,]+).*?đ/i);
          if (bonusMatch && bonusMatch[1]) {
            // Process the bonus value correctly - remove dots and commas before parsing
            const cleanedBonus = bonusMatch[1].replace(/[.,]/g, "");
            bonus = parseInt(cleanedBonus, 10);

            // Validate the extracted bonus - if it's suspiciously small (like 50 instead of 50000)
            // and we have "500.000" in the string, assume it should be 50000
            if (bonus <= 100 && orderInfo.includes("500.000")) {
              console.log("Correcting suspiciously small bonus value");
              bonus = 50000;
            }
          }
        }
      }

      console.log("Final extracted bonus value:", bonus);

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
        metadata: {
          bonus: bonus, // Store the bonus amount in metadata
        },
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
    // Start a database transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Original processing logic
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

      if (!secureHash) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ success: false, message: "Missing security hash" });
      }
      if (
        !verifyVNPaySecureHash(vnpParams, secureHash, vnpayConfig.hashSecret!)
      ) {
        await session.abortTransaction();
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
      if (!payment) {
        await session.abortTransaction();
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });
      }

      let updatedPayment;
      if (vnpResponseCode === "00" && vnpTransactionStatus === "00") {
        // Use atomic update to prevent race conditions
        updatedPayment = await Payment.findOneAndUpdate(
          {
            vnpayTransactionRef: vnpTxnRef,
            status: "pending", // Only update if still pending
          },
          {
            status: "completed",
            transactionId: vnpTransactionNo,
            completedAt: new Date(),
            paymentDate: new Date(
              vnpPayDate.replace(
                /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                "$1-$2-$3T$4:$5:$6"
              )
            ),
            metadata: {
              ...payment.metadata,
              vnpResponseCode,
              vnpTransactionStatus,
              vnpTransactionNo,
              vnpPayDate,
              serverProcessed: true, // Mark as processed by server IPN
            },
          },
          {
            new: true,
            session,
            runValidators: true,
          }
        );

        // If update was successful, process wallet
        if (updatedPayment) {
          console.log(
            `🔔 IPN processing payment ${payment.orderId} - atomic update successful`
          );
          await this.updateWalletAfterPayment(updatedPayment, session);
        } else {
          console.log(
            `🔔 IPN payment ${payment.orderId} already processed by another request`
          );
          // Payment was already processed, just return success
          updatedPayment = await Payment.findOne({
            vnpayTransactionRef: vnpTxnRef,
          });
        }
      } else {
        // Update to failed status
        updatedPayment = await Payment.findOneAndUpdate(
          {
            vnpayTransactionRef: vnpTxnRef,
            status: "pending",
          },
          {
            status: "failed",
            failedAt: new Date(),
            metadata: {
              ...payment.metadata,
              vnpResponseCode,
              vnpTransactionStatus,
              failureReason: this.getVNPayErrorMessage(vnpResponseCode),
              serverProcessed: true,
            },
          },
          {
            new: true,
            session,
            runValidators: true,
          }
        );

        // If no update happened, get current state
        if (!updatedPayment) {
          updatedPayment = await Payment.findOne({
            vnpayTransactionRef: vnpTxnRef,
          });
        }
      }

      // Commit transaction
      await session.commitTransaction();

      // Ensure we have a valid payment object
      if (!updatedPayment) {
        return res.status(500).json({
          success: false,
          message: "Failed to process payment update",
        });
      }

      res.json({
        success: updatedPayment.status === "completed",
        message:
          updatedPayment.status === "completed"
            ? "Payment completed successfully"
            : "Payment failed",
        data: {
          orderId: updatedPayment.orderId,
          amount: vnpAmount,
          status: updatedPayment.status,
          transactionId: updatedPayment.transactionId || vnpTransactionNo,
          paymentDate: updatedPayment.paymentDate,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Error processing VNPAY return:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    } finally {
      session.endSession();
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

      // Extract filter parameters
      const status = req.query.status as string;
      const type = req.query.type as string;
      const search = req.query.search as string;
      const fromDate = req.query.fromDate as string;
      const toDate = req.query.toDate as string;
      const dateRange = req.query.dateRange as string;

      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: "User not authenticated" });

      // Build query filters
      const filters: any = { userId };

      // Filter by status
      if (status && status !== "all") {
        filters.status = status;
      }

      // Filter by transaction type based on description
      if (type && type !== "all") {
        if (type === "topup") {
          filters.description = { $regex: /nạp|nap|topup/i };
        } else if (type === "payment") {
          filters.description = { $regex: /thanh toán|payment|mua/i };
        }
      }

      // Filter by search term (orderId or description)
      if (search && search.trim() !== "") {
        const searchRegex = new RegExp(search.trim(), "i");
        filters.$or = [{ orderId: searchRegex }, { description: searchRegex }];
      }

      // Filter by date range
      let fromDateObj: Date | undefined = undefined;
      let toDateObj: Date | undefined = undefined;

      // Process preset date ranges
      if (dateRange && dateRange !== "all") {
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        if (dateRange === "7days") {
          fromDateObj = new Date(today);
          fromDateObj.setDate(fromDateObj.getDate() - 7);
        } else if (dateRange === "30days") {
          fromDateObj = new Date(today);
          fromDateObj.setDate(fromDateObj.getDate() - 30);
        } else if (dateRange === "90days") {
          fromDateObj = new Date(today);
          fromDateObj.setDate(fromDateObj.getDate() - 90);
        } else if (dateRange === "thisMonth") {
          fromDateObj = new Date(today.getFullYear(), today.getMonth(), 1);
        } else if (dateRange === "lastMonth") {
          const lastMonth = today.getMonth() - 1;
          const year =
            lastMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
          const month = lastMonth < 0 ? 11 : lastMonth;
          fromDateObj = new Date(year, month, 1);
          toDateObj = new Date(
            today.getFullYear(),
            today.getMonth(),
            0,
            23,
            59,
            59,
            999
          );
        }
      } else {
        // Process explicit date range
        if (fromDate) {
          fromDateObj = new Date(fromDate);
        }
        if (toDate) {
          toDateObj = new Date(toDate);
          // Set to end of day
          toDateObj.setHours(23, 59, 59, 999);
        }
      }

      // Add date filters if either date is specified
      if (fromDateObj || toDateObj) {
        filters.createdAt = {};
        if (fromDateObj) {
          filters.createdAt.$gte = fromDateObj;
        }
        if (toDateObj) {
          filters.createdAt.$lte = toDateObj;
        }
      }

      console.log("Payment filters:", filters);

      // Execute query with filters
      const payments = await Payment.find(filters)
        .populate("postId", "title description price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPayments = await Payment.countDocuments(filters);

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
      console.log(`Checking payment status for orderId: ${orderId}`);
      const payment = await Payment.findOne({ orderId });
      console.log(`Found payment: ${payment ? "Yes" : "No"}`);

      if (!payment)
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });

      // If the payment is pending but we have VNPay callback parameters
      // and the request is from a verified user, we can update it
      if (
        payment.status === "pending" &&
        req.user &&
        req.user.userId === payment.userId.toString()
      ) {
        // Check if this payment should have been completed (had VNPay callbacks)
        if (
          payment.metadata &&
          payment.metadata.vnpResponseCode === "00" &&
          payment.metadata.vnpTransactionStatus === "00"
        ) {
          // Update payment to completed
          payment.status = "completed";
          payment.completedAt = new Date();
          await payment.save();
          console.log(`Payment ${orderId} updated to completed status`);
        }
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
      "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
      "12": "Thẻ/Tài khoản của khách hàng bị khóa.",
      "13": "Nhập sai mật khẩu xác thực giao dịch (OTP). Vui lòng thực hiện lại giao dịch.",
      "24": "Khách hàng hủy giao dịch",
      "51": "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
      "65": "Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      "75": "Ngân hàng thanh toán đang bảo trì.",
      "79": "Nhập sai mật khẩu thanh toán quá số lần quy định. Vui lòng thực hiện lại giao dịch.",
      "99": "Giao dịch thất bại",
      // Original error codes
      "20": "Đã hoàn tiền",
      "21": "Hoàn tiền bị từ chối",
      "22": "Giao dịch chưa được thanh toán",
      default: "Giao dịch thất bại",
    };

    return errorMessages[responseCode] || errorMessages["default"];
  }

  /**
   * Cập nhật trạng thái thanh toán từ client
   */
  async updatePaymentStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId } = req.params;
      const vnpayData = req.body;
      const forceStatus = vnpayData.forceStatus; // Get forced status if present

      console.log(
        `Updating payment status for orderId: ${orderId} with data:`,
        vnpayData
      );

      // Find the payment and check authorization
      const payment = await Payment.findOne({ orderId });

      if (!payment)
        return res
          .status(404)
          .json({ success: false, message: "Payment not found" });

      // Check if authenticated user matches the payment's user
      if (req.user && req.user.userId !== payment.userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this payment",
        });
      }

      // Prepare update data based on request
      let updateData: any = {};
      let shouldProcessWallet = false;

      if (forceStatus === "failed") {
        const vnp_ResponseCode = vnpayData.vnp_ResponseCode;
        updateData = {
          status: "failed",
          failedAt: new Date(),
          metadata: {
            ...payment.metadata,
            ...vnpayData.allParams,
            clientUpdated: true,
            vnpResponseCode: vnp_ResponseCode,
            failureReason: this.getVNPayErrorMessage(vnp_ResponseCode),
          },
        };
      } else {
        // Normal processing based on VNPay data
        const vnp_ResponseCode = vnpayData.vnp_ResponseCode;
        const vnp_TransactionStatus = vnpayData.vnp_TransactionStatus;

        if (vnp_ResponseCode === "00" && vnp_TransactionStatus === "00") {
          let paymentDate = new Date();
          if (vnpayData.vnp_PayDate) {
            try {
              paymentDate = new Date(
                vnpayData.vnp_PayDate.replace(
                  /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
                  "$1-$2-$3T$4:$5:$6"
                )
              );
            } catch (e) {
              console.error("Error parsing payment date:", e);
            }
          }

          updateData = {
            status: "completed",
            transactionId: vnpayData.vnp_TransactionNo,
            completedAt: new Date(),
            paymentDate: paymentDate,
            metadata: {
              ...payment.metadata,
              ...vnpayData.allParams,
              vnpResponseCode: vnp_ResponseCode,
              vnpTransactionStatus: vnp_TransactionStatus,
              clientUpdated: true,
            },
          };
          shouldProcessWallet = true;
        } else {
          updateData = {
            status: "failed",
            failedAt: new Date(),
            metadata: {
              ...payment.metadata,
              ...vnpayData.allParams,
              clientUpdated: true,
              failureReason: this.getVNPayErrorMessage(vnp_ResponseCode),
            },
          };
        }
      }

      // Use atomic findOneAndUpdate to prevent race conditions
      // Only update if status is still "pending"
      const updatedPayment = await Payment.findOneAndUpdate(
        {
          orderId: orderId,
          status: "pending", // Only update if still pending
        },
        updateData,
        {
          new: true, // Return updated document
          runValidators: true,
        }
      );

      // If no document was updated, it means either:
      // 1. Payment not found (handled above)
      // 2. Payment already processed by another request
      if (!updatedPayment) {
        // Check if payment exists but is already processed
        const existingPayment = await Payment.findOne({ orderId });
        if (existingPayment) {
          return res.json({
            success: true,
            message: "Payment already processed",
            data: {
              orderId: existingPayment.orderId,
              status: existingPayment.status,
            },
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Payment not found",
          });
        }
      }

      // If payment is completed and we successfully updated it, process wallet
      if (shouldProcessWallet && updatedPayment.status === "completed") {
        try {
          // Since we used atomic update, this is the first and only completion
          // No need to skip notification
          console.log(
            `🔔 Payment ${orderId} notification decision: skip=false (atomic update success)`
          );

          await this.updateWalletAfterPayment(updatedPayment, undefined, false);

          console.log(
            `Updated wallet for payment ${orderId} (notification sent for first completion)`
          );
        } catch (error) {
          console.error("Error updating wallet after payment:", error);
          // Don't fail the response for wallet/notification errors
        }
      }

      console.log(
        `Updated payment ${orderId} to ${updatedPayment.status} status`
      );

      res.json({
        success: true,
        message: `Payment status updated to ${updatedPayment.status}`,
        data: {
          orderId: updatedPayment.orderId,
          status: updatedPayment.status,
        },
      });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Process a successful payment and update the user's wallet
   */
  private async updateWalletAfterPayment(
    payment: any,
    session?: mongoose.ClientSession,
    skipNotification: boolean = false
  ) {
    try {
      if (payment.status !== "completed") {
        return false; // Only process completed payments
      }

      // Check if this payment has already been processed for wallet update
      if (payment.walletProcessed) {
        console.log(
          `Payment ${payment.orderId} already processed for wallet update, skipping...`
        );
        return true; // Already processed, but return success
      }

      // Find or create wallet
      let wallet = await Wallet.findOne({ userId: payment.userId });

      if (!wallet) {
        wallet = new Wallet({
          userId: payment.userId,
          balance: 0,
          totalIncome: 0,
          totalSpending: 0,
          bonusEarned: 0,
        });
      }

      // Determine transaction type and amount
      const description = payment.description.toLowerCase();
      // Cải thiện logic xác định isTopup
      const isTopup =
        description.includes("nap") ||
        description.includes("nạp") ||
        description.includes("topup") ||
        description.includes("deposit") ||
        description.includes("nạp tiền") ||
        description.includes("nap tien") ||
        !payment.metadata?.packageName; // Nếu không có packageName thì mặc định là topup

      console.log(
        `💰 Processing payment - isTopup: ${isTopup}, description: "${description}"`
      );

      if (isTopup) {
        // Process deposit to wallet
        wallet.balance += payment.amount;
        wallet.totalIncome += payment.amount;

        // Process bonus if any
        const bonus = payment.metadata?.bonus || 0;
        console.log("Processing wallet update with bonus:", bonus);
        if (bonus > 0) {
          // Ensure the bonus is a reasonable amount (prevent issues with currency formatting)
          // For a 500k top-up, bonus should be 50,000 VND
          let finalBonus = bonus;
          if (payment.amount === 500000 && (bonus < 1000 || bonus > 100000)) {
            console.log("Correcting invalid bonus amount for 500k top-up");
            finalBonus = 50000;
          }

          console.log(`Adding bonus to wallet: ${finalBonus} VND`);
          wallet.balance += finalBonus;
          wallet.bonusEarned = (wallet.bonusEarned || 0) + finalBonus;
        }
      } else {
        // Process payment from wallet
        wallet.totalSpending += payment.amount;
        // Deduct from balance only if it's a payment (not a topup)
        if (!isTopup) {
          wallet.balance -= payment.amount;
        }
      }

      wallet.lastTransaction = new Date();

      // Save with session if provided, otherwise normal save
      if (session) {
        await wallet.save({ session });
      } else {
        await wallet.save();
      }

      // Update payment to mark it as processed for wallet
      // Mark payment as wallet processed to prevent duplicate processing
      payment.walletProcessed = true;
      payment.metadata = {
        ...payment.metadata,
        processedAt: new Date(),
        balanceAfter: wallet.balance,
      };

      if (session) {
        await payment.save({ session });
      } else {
        await payment.save();
      }

      // Send notification for successful top-up
      if (isTopup && !skipNotification) {
        try {
          console.log(
            `🔔 Creating top-up notification for user ${payment.userId}, amount: ${payment.amount}`
          );
          await NotificationService.createTopUpSuccessNotification(
            payment.userId,
            payment.amount,
            payment.orderId
          );
          console.log(`✅ Top-up notification created successfully`);
        } catch (error) {
          console.error("❌ Error sending top-up notification:", error);
          // Don't fail the transaction for notification error
        }
      } else if (isTopup && skipNotification) {
        console.log(
          `🔔 Skipping duplicate notification for payment ${payment.orderId}`
        );
      }

      // ❌ XÓA PACKAGE PURCHASE NOTIFICATION - KHÔNG CẦN THIẾT
      // if (!isTopup && payment.metadata?.packageName) {
      //   try {
      //     await NotificationService.createPackagePurchaseNotification(
      //       payment.userId,
      //       payment.metadata.packageName,
      //       payment.amount,
      //       payment.orderId,
      //       payment.metadata.packageDuration || 30
      //     );
      //   } catch (error) {
      //     console.error("Error sending package purchase notification:", error);
      //   }
      // }

      return true;
    } catch (error) {
      console.error("Error updating wallet after payment:", error);
      return false;
    }
  }

  /**
   * Lấy thông tin ví của người dùng
   */
  async getUserWalletInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Try to find wallet first
      let wallet = await Wallet.findOne({ userId });

      // If wallet doesn't exist, create one
      if (!wallet) {
        // Get successful payments (money added to wallet)
        const completedPayments = await Payment.find({
          userId,
          status: "completed",
        });

        // Initialize totals
        let totalIncome = 0;
        let totalSpending = 0;
        let bonusEarned = 0;

        // Calculate from payment history
        completedPayments.forEach((payment) => {
          const desc = payment.description.toLowerCase();
          if (
            desc.includes("nap") ||
            desc.includes("nạp") ||
            desc.includes("topup")
          ) {
            totalIncome += payment.amount;
            if (payment.metadata?.bonus) {
              bonusEarned += payment.metadata.bonus;
            }
          } else {
            totalSpending += payment.amount;
          }
        });

        // Create new wallet with calculated values
        wallet = new Wallet({
          userId,
          balance: Math.max(0, totalIncome - totalSpending),
          totalIncome,
          totalSpending,
          bonusEarned,
          lastTransaction:
            completedPayments.length > 0
              ? completedPayments.reduce((latest, current) => {
                  return latest.createdAt > current.createdAt
                    ? latest
                    : current;
                }).createdAt
              : null,
        });

        await wallet.save();
      }

      // Get total count of transactions
      const totalTransactions = await Payment.countDocuments({ userId });

      // Get recent transactions
      const recentTransactions = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        data: {
          balance: wallet.balance,
          totalIncome: wallet.totalIncome,
          totalSpending: wallet.totalSpending,
          bonusEarned: wallet.bonusEarned || 0,
          lastTransaction: wallet.lastTransaction,
          totalTransactions,
          recentTransactions,
        },
      });
    } catch (error) {
      console.error("Error getting user wallet info:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
