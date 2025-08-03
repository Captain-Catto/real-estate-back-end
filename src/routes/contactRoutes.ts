import { Router } from "express";
import { ContactController } from "../controllers/ContactController";
import { authenticateUser, authenticateAdmin } from "../middleware";

const router = Router();

// Public routes
router.post("/contact", ContactController.createContactMessage);

// Admin routes (require authentication and admin role)
router.get(
  "/admin/contact",
  authenticateAdmin,
  ContactController.getContactMessages
);
router.get(
  "/admin/contact/stats",
  authenticateAdmin,
  ContactController.getContactStats
);
router.get(
  "/admin/contact/:id",
  authenticateAdmin,
  ContactController.getContactMessageById
);
router.patch(
  "/admin/contact/:id/status",
  authenticateAdmin,
  ContactController.updateContactMessageStatus
);
router.post(
  "/admin/contact/:id/reply",
  authenticateAdmin,
  ContactController.replyToContactMessage
);
router.patch(
  "/admin/contact/bulk/status",
  authenticateAdmin,
  ContactController.bulkUpdateStatus
);
router.delete(
  "/admin/contact/:id",
  authenticateAdmin,
  ContactController.deleteContactMessage
);
router.post(
  "/admin/contact/logs",
  authenticateAdmin,
  ContactController.createContactLog
);
router.get(
  "/admin/contact/:contactId/logs",
  authenticateAdmin,
  ContactController.getContactLogs
);
router.put(
  "/admin/contact/logs/:logId",
  authenticateAdmin,
  ContactController.updateContactLogNote
);

export default router;
