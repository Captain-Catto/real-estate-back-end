import { Router } from "express";
import { WalletController } from "../controllers";
import { authenticateUser } from "../middleware";

const router = Router();
const walletController = new WalletController();

router.get(
  "/info",
  authenticateUser,
  walletController.getWalletInfo.bind(walletController)
);

router.post(
  "/process-payment",
  authenticateUser,
  walletController.processPaymentUpdate.bind(walletController)
);

router.get(
  "/transactions",
  authenticateUser,
  walletController.getTransactionHistory.bind(walletController)
);

router.post(
  "/sync",
  authenticateUser,
  walletController.syncWalletWithPayments.bind(walletController)
);

// Admin-only route
router.post(
  "/adjust",
  authenticateUser,
  walletController.adjustWalletBalance.bind(walletController)
);

// Post payment route
router.post(
  "/deduct-for-post",
  authenticateUser,
  walletController.deductForPostPayment.bind(walletController)
);

export default router;