import express from "express";
import { CustomerContactController } from "../controllers/CustomerContactController";
import { authenticateUser } from "../middleware";

const router = express.Router();

// POST /api/customer-contacts/call-back - Tạo yêu cầu gọi lại
router.post(
  "/call-back",
  authenticateUser,
  CustomerContactController.createCallBackRequest
);

// GET /api/customer-contacts/my-contacts - Lấy danh sách contacts mà user nhận được (chủ tin đăng)
router.get(
  "/my-contacts",
  authenticateUser,
  CustomerContactController.getUserContacts
);

// GET /api/customer-contacts/my-stats - Lấy thống kê contacts của user
router.get(
  "/my-stats",
  authenticateUser,
  CustomerContactController.getUserContactStats
);

// Admin routes - phải đặt TRƯỚC các dynamic routes
// GET /api/customer-contacts/stats - Lấy thống kê tổng quan (admin only)
router.get(
  "/stats",
  authenticateUser,
  CustomerContactController.getContactStats
);

// GET /api/customer-contacts/user/:userId - Lấy contacts theo user ID (admin only)
router.get(
  "/user/:userId",
  authenticateUser,
  CustomerContactController.getContactsByUserId
);

// Dynamic routes phải đặt CUỐI CÙNG
// PUT /api/customer-contacts/:contactId/status - Cập nhật trạng thái contact
router.put(
  "/:contactId/status",
  authenticateUser,
  CustomerContactController.updateContactStatus
);

// PUT /api/customer-contacts/:contactId/restore - Khôi phục contact đã soft delete
router.put(
  "/:contactId/restore",
  authenticateUser,
  CustomerContactController.restoreContact
);

// DELETE /api/customer-contacts/:contactId - Soft delete contact (user chỉ được soft delete)
router.delete(
  "/:contactId",
  authenticateUser,
  CustomerContactController.softDeleteContact
);

// DELETE /api/customer-contacts/:contactId/hard-delete - Hard delete for admin only
router.delete(
  "/:contactId/hard-delete",
  authenticateUser,
  CustomerContactController.hardDeleteContact
);

export default router;
