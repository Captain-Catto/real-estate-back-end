import { Response } from "express";
import { Wallet, Payment, User, Post } from "../models";
import { AuthenticatedRequest } from "../middleware";
import mongoose from "mongoose";
import { NotificationService } from "../services/NotificationService";

export class WalletController {
  /**
   * Initialize a user's wallet if it doesn't exist
   */
  private async ensureWalletExists(userId: string): Promise<any> {
    try {
      // Check if wallet exists
      let wallet = await Wallet.findOne({ userId });

      // If not, create a new wallet
      if (!wallet) {
        wallet = new Wallet({
          userId,
          balance: 0,
          totalIncome: 0,
          totalSpending: 0,
        });
        await wallet.save();
      }

      return wallet;
    } catch (error) {
      console.error("Error ensuring wallet exists:", error);
      throw error;
    }
  }

  /**
   * Get wallet info for the current user
   */
  async getWalletInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get or create the wallet
      const wallet = await this.ensureWalletExists(userId);

      // Get recent transactions
      const recentTransactions = await Payment.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);

      // Count total transactions
      const totalTransactions = await Payment.countDocuments({ userId });

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
      console.error("Error getting wallet info:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Update wallet balance after a successful payment
   */
  async processPaymentUpdate(req: AuthenticatedRequest, res: Response) {
    try {
      const { orderId, amount, bonus, type } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!orderId || !amount || !type) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: orderId, amount, type",
        });
      }

      // Get or create the wallet
      const wallet = await this.ensureWalletExists(userId);
      console.log("Wallet found or created:", wallet);

      // Check if the payment exists
      const payment = await Payment.findOne({ orderId, userId });
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      // Only process completed payments that haven't been processed
      if (payment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Payment is not completed",
        });
      }

      // Update wallet based on transaction type
      if (type === "topup") {
        // Add money to wallet
        wallet.balance += amount;
        wallet.totalIncome += amount;

        // Add bonus if applicable
        if (bonus && bonus > 0) {
          // Ensure the bonus is a reasonable amount for known top-up amounts
          let finalBonus = bonus;

          // For a 500k top-up, bonus should be 50,000 VND
          if (amount === 500000 && (bonus < 1000 || bonus > 100000)) {
            console.log("Correcting invalid bonus amount for 500k top-up");
            finalBonus = 50000;
          }

          console.log(
            `Adding bonus to wallet: ${finalBonus} VND (original bonus: ${bonus} VND)`
          );
          wallet.balance += finalBonus;
          wallet.bonusEarned = (wallet.bonusEarned || 0) + finalBonus;
        }
      } else if (type === "spend") {
        // Check if user has enough balance
        if (wallet.balance < amount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance",
          });
        }

        // Deduct money from wallet
        wallet.balance -= amount;
        wallet.totalSpending += amount;
      }

      // Update last transaction date
      wallet.lastTransaction = new Date();

      // Save wallet changes
      await wallet.save();

      // Update payment metadata with wallet transaction info
      payment.metadata = {
        ...payment.metadata,
        walletProcessed: true,
        processedAt: new Date(),
        balanceAfter: wallet.balance,
      };

      await payment.save();

      res.json({
        success: true,
        message: "Wallet updated successfully",
        data: {
          balance: wallet.balance,
          totalIncome: wallet.totalIncome,
          totalSpending: wallet.totalSpending,
          bonusEarned: wallet.bonusEarned,
        },
      });
    } catch (error) {
      console.error("Error processing payment update:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get transaction history with pagination and filters
   */
  async getTransactionHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Build filters
      const filters: any = { userId };

      if (type === "income") {
        filters.amount = { $gt: 0 };
      } else if (type === "spending") {
        filters.amount = { $lt: 0 };
      }

      // Add date filters if provided
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) {
          filters.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          filters.createdAt.$lte = endDateTime;
        }
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Fetch transactions
      const transactions = await Payment.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Count total transactions
      const totalTransactions = await Payment.countDocuments(filters);

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            totalItems: totalTransactions,
            itemsPerPage: limit,
          },
        },
      });
    } catch (error) {
      console.error("Error getting transaction history:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Admin function to adjust user wallet balance
   */
  async adjustWalletBalance(req: AuthenticatedRequest, res: Response) {
    try {
      // Only allow admins
      if (req.user?.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Unauthorized - Admin access required",
        });
      }

      const { userId, amount, reason, type } = req.body;

      if (!userId || !amount || !type) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: userId, amount, type (add/subtract)",
        });
      }

      // Validate user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Get or create wallet
      const wallet = await this.ensureWalletExists(userId);

      // Adjust balance
      if (type === "add") {
        wallet.balance += amount;
        wallet.totalIncome += amount;
      } else if (type === "subtract") {
        if (wallet.balance < amount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance",
          });
        }
        wallet.balance -= amount;
        wallet.totalSpending += amount;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid type, must be 'add' or 'subtract'",
        });
      }

      wallet.lastTransaction = new Date();
      await wallet.save();

      // Create an admin adjustment payment record
      const payment = new Payment({
        userId,
        orderId: `ADMIN_ADJ_${Date.now()}`,
        amount: type === "add" ? amount : -amount,
        currency: "VND",
        paymentMethod: "admin_adjustment",
        status: "completed",
        description:
          reason ||
          `Admin ${type === "add" ? "deposit" : "withdrawal"}: ${amount} VND`,
        completedAt: new Date(),
        metadata: {
          adjustedBy: req.user.userId,
          reason,
          originalBalance: wallet.balance - (type === "add" ? amount : -amount),
          newBalance: wallet.balance,
        },
      });

      await payment.save();

      res.json({
        success: true,
        message: `Balance ${
          type === "add" ? "increased" : "decreased"
        } successfully`,
        data: {
          userId,
          newBalance: wallet.balance,
          adjustment: type === "add" ? amount : -amount,
        },
      });
    } catch (error) {
      console.error("Error adjusting wallet balance:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Sync wallet with payment history
   * (useful for migrations or fixing inconsistencies)
   */
  async syncWalletWithPayments(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get all completed payments for this user
      const payments = await Payment.find({
        userId,
        status: "completed",
      });

      // Calculate totals
      let totalIncome = 0;
      let totalSpending = 0;
      let bonusEarned = 0;

      payments.forEach((payment) => {
        // Determine if it's income or spending based on description or amount
        const desc = payment.description.toLowerCase();

        if (
          desc.includes("nap") ||
          desc.includes("nạp") ||
          desc.includes("topup")
        ) {
          totalIncome += payment.amount;

          // Add any bonuses
          if (payment.metadata && payment.metadata.bonus) {
            bonusEarned += payment.metadata.bonus;
            totalIncome += payment.metadata.bonus;
          }
        } else {
          totalSpending += payment.amount;
        }
      });

      // Calculate final balance
      const balance = totalIncome - totalSpending;

      // Update wallet
      const wallet = await this.ensureWalletExists(userId);
      wallet.balance = balance < 0 ? 0 : balance; // Ensure balance is not negative
      wallet.totalIncome = totalIncome;
      wallet.totalSpending = totalSpending;
      wallet.bonusEarned = bonusEarned;

      if (payments.length > 0) {
        // Find the most recent transaction
        const lastPayment = payments.reduce((latest, current) => {
          return latest.createdAt > current.createdAt ? latest : current;
        });
        wallet.lastTransaction = lastPayment.createdAt;
      }

      await wallet.save();

      res.json({
        success: true,
        message: "Wallet synchronized successfully",
        data: {
          balance: wallet.balance,
          totalIncome: wallet.totalIncome,
          totalSpending: wallet.totalSpending,
          bonusEarned: wallet.bonusEarned,
          lastTransaction: wallet.lastTransaction,
        },
      });
    } catch (error) {
      console.error("Error syncing wallet:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Deduct money from wallet for post payment
   */
  async deductForPostPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { amount, postId, packageId, description } = req.body;
      console.log("postId:", postId);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Amount is required and must be greater than 0",
        });
      }

      if (!postId) {
        return res.status(400).json({
          success: false,
          message: "Post ID is required",
        });
      }

      // Get post details for notification
      const post = await Post.findById(postId);
      const postTitle = (post?.title || "Tin đăng bất động sản").toString();

      // Get user wallet
      const wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found",
        });
      }

      // Check if user has enough balance
      if (wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance",
        });
      }

      // Create a new payment record
      const orderId = `POST_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const payment = new Payment({
        userId,
        postId,
        orderId,
        amount,
        currency: "VND",
        paymentMethod: "vnpay", // Using vnpay as the payment method as requested
        status: "completed",
        description: description || "Thanh toán đăng tin bất động sản",
        metadata: {
          packageId,
          isWalletPayment: true, // Flag to identify this as a wallet payment
          walletTransactionType: "payment",
        },
        completedAt: new Date(),
      });

      // Update wallet balance
      wallet.balance -= amount;
      wallet.totalSpending += amount;
      wallet.lastTransaction = new Date();

      // Save changes (no transaction)
      await payment.save();
      await wallet.save();

      // 🔔 Tạo notification thanh toán tin đăng
      try {
        console.log(
          `🔔 Creating post payment notification for user ${userId}, post: ${postTitle}, amount: ${amount}`
        );
        await NotificationService.createPostPaymentNotification(
          userId,
          postTitle,
          amount,
          postId,
          orderId
        );
        console.log(`✅ Post payment notification created successfully`);
      } catch (error) {
        console.error("❌ Error sending post payment notification:", error);
        // Don't fail the transaction for notification error
      }

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: {
          newBalance: wallet.balance,
          payment: {
            orderId: payment.orderId,
            amount: payment.amount,
            status: payment.status,
          },
        },
      });
    } catch (error) {
      console.error("Error processing post payment:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while processing payment",
      });
    }
  }
}
