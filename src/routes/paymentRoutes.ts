import { Router } from "express";
import { PaymentController } from "../controllers";
import { authenticateUser } from "../middleware";

const router = Router();
const paymentController = new PaymentController();

// Authenticated routes
router.post(
  "/vnpay/create-payment-url",
  authenticateUser,
  paymentController.createVNPayPaymentUrl.bind(paymentController)
);

router.get(
  "/history",
  authenticateUser,
  paymentController.getPaymentHistory.bind(paymentController)
);

router.get(
  "/details/:orderId",
  authenticateUser,
  paymentController.getPaymentDetails.bind(paymentController)
);

router.get(
  "/check-status/:orderId",
  authenticateUser,
  paymentController.checkPaymentStatus.bind(paymentController)
);

router.post(
  "/update-status/:orderId",
  authenticateUser,
  paymentController.updatePaymentStatus.bind(paymentController)
);

router.get(
  "/wallet-info",
  authenticateUser,
  paymentController.getUserWalletInfo.bind(paymentController)
);

// Public VNPay callback routes
router.get(
  "/vnpay/return",
  paymentController.processVNPayReturn.bind(paymentController)
);

router.get(
  "/vnpay/ipn",
  paymentController.processVNPayIPN.bind(paymentController)
);

export default router;