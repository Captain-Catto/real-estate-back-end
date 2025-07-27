import { Router } from "express";
import { PaymentSchedulerController } from "../controllers/PaymentSchedulerController";
import { authenticateUser } from "../middleware/index";

const router = Router();

// Middleware để chỉ admin mới được truy cập
const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
    });
  }
  next();
};

// Routes cho admin quản lý payment scheduler
router.get(
  "/stats",
  authenticateUser,
  adminOnly,
  PaymentSchedulerController.getExpiringPaymentsStats
);
router.post(
  "/cancel-expired",
  authenticateUser,
  adminOnly,
  PaymentSchedulerController.cancelExpiredPaymentsNow
);
router.get(
  "/pending",
  authenticateUser,
  adminOnly,
  PaymentSchedulerController.getPendingPayments
);
router.post(
  "/cancel/:paymentId",
  authenticateUser,
  adminOnly,
  PaymentSchedulerController.cancelPayment
);

export default router;
