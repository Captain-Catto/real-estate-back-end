import { Response } from "express";
import { AuthenticatedRequest } from "../middleware";
import UserPermission from "../models/UserPermission";
import { User } from "../models";
import mongoose from "mongoose";

export class PermissionController {
  /**
   * Lấy danh sách quyền của người dùng
   */
  static async getUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Chỉ admin hoặc chính người dùng mới có thể xem quyền của người dùng đó
      if (req.user?.role !== "admin" && req.user?.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thực hiện hành động này",
        });
      }

      // Kiểm tra người dùng tồn tại
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Lấy danh sách quyền
      const userPermission = await UserPermission.findOne({ userId });
      const permissions = userPermission?.permissions || [];

      return res.status(200).json({
        success: true,
        data: { permissions, username: user.username, userId },
        message: "Lấy danh sách quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy quyền người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy quyền người dùng",
      });
    }
  }

  /**
   * Cập nhật quyền cho người dùng
   */
  static async updateUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      // Permission validation is already handled by requirePermission("change_user_role") middleware
      // So we don't need to check admin role here anymore

      // Kiểm tra dữ liệu đầu vào
      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "Định dạng quyền không hợp lệ",
        });
      }

      // Kiểm tra người dùng tồn tại
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Cập nhật hoặc tạo mới quyền
      const userPermission = await UserPermission.findOneAndUpdate(
        { userId },
        { permissions },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        data: {
          userId,
          username: user.username,
          permissions: userPermission.permissions,
        },
        message: "Cập nhật quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật quyền người dùng",
      });
    }
  }

  /**
   * Tạo quyền cho người dùng
   */
  static async createUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId, permissions } = req.body;

      // Permission validation is already handled by requirePermission("change_user_role") middleware

      // Kiểm tra dữ liệu đầu vào
      if (!userId || !Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
        });
      }

      // Kiểm tra người dùng tồn tại
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Kiểm tra quyền đã tồn tại
      const existingPermission = await UserPermission.findOne({ userId });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: "Quyền cho người dùng này đã tồn tại",
        });
      }

      // Tạo mới quyền
      const userPermission = new UserPermission({
        userId,
        permissions,
      });

      await userPermission.save();

      return res.status(201).json({
        success: true,
        data: {
          userId,
          username: user.username,
          permissions: userPermission.permissions,
        },
        message: "Tạo quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi tạo quyền người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo quyền người dùng",
      });
    }
  }

  /**
   * Xóa quyền của người dùng
   */
  static async deleteUserPermissions(req: AuthenticatedRequest, res: Response) {
    try {
      const { userId } = req.params;

      // Permission validation is already handled by requirePermission("change_user_role") middleware

      // Kiểm tra người dùng tồn tại
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      // Xóa quyền
      const result = await UserPermission.deleteOne({ userId });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy quyền của người dùng này",
        });
      }

      return res.status(200).json({
        success: true,
        data: { userId },
        message: "Xóa quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi xóa quyền người dùng:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa quyền người dùng",
      });
    }
  }

  /**
   * Lấy danh sách quyền có sẵn
   */
  static async getAvailablePermissions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      // Định nghĩa các nhóm quyền đầy đủ
      const permissionGroups = {
        users: [
          "view_users",
          "create_user",
          "edit_user",
          "delete_user",
          "change_user_role",
          "change_user_status",
          "reset_user_password",
          "approve_user",
        ],
        posts: [
          "view_posts",
          "edit_post",
          "delete_post",
          "approve_post",
          "reject_post",
          "view_deleted_posts",
          "restore_post",
        ],
        projects: [
          "view_projects",
          "create_project",
          "edit_project",
          "delete_project",
        ],
        news: [
          "view_news",
          "create_news",
          "edit_news",
          "delete_news",
          "feature_news",
          "manage_news_categories",
        ],
        transactions: ["view_transactions"],
        statistics: [
          "view_statistics",
          "export_statistics",
          "generate_reports",
          "view_financial_stats",
        ],
        settings: [
          "view_settings",
          "edit_settings",
          "manage_sidebar",
          "manage_header",
        ],
        locations: [
          "view_locations",
          "manage_locations",
          "manage_areas",
          "manage_prices",
        ],
      };

      // Quyền có thể quản lý cho employee
      const manageableEmployeePermissions = [
        "create_user",
        "edit_user",
        "delete_user",
        "change_user_status",
        "change_user_role",
        "edit_post",
        "delete_post",
        "approve_post",
        "reject_post",
        "create_project",
        "edit_project",
        "delete_project",
        "create_news",
        "edit_news",
        "delete_news",
        "feature_news",
        "publish_news",
        "manage_news_categories",
        "view_transactions",
        "view_statistics",
        "export_statistics",
        "generate_reports",
        "edit_settings",
        "manage_categories",
        "manage_locations",
        "manage_areas",
        "manage_prices",
      ];
      console.log("Available permissions fetched successfully");
      return res.status(200).json({
        success: true,
        data: {
          permissionGroups,
          manageableEmployeePermissions,
        },
        message: "Lấy danh sách quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quyền:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách quyền",
      });
    }
  }

  /**
   * Lấy danh sách người dùng và quyền
   */
  static async getUsersAndPermissions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      // Permission validation handled by requirePermission("view_users") middleware

      // Lấy danh sách người dùng (không phải admin)
      const users = await User.find({ role: { $ne: "admin" } }).select(
        "username email role status createdAt"
      );

      // Lấy quyền của từng người dùng
      const userPermissions = await UserPermission.find({
        userId: { $in: users.map((user: any) => user._id) },
      });

      // Map quyền vào người dùng
      const usersWithPermissions = users.map((user: any) => {
        const userPerm = userPermissions.find(
          (up) => up.userId.toString() === user._id.toString()
        );

        return {
          ...user.toObject(),
          permissions: userPerm?.permissions || [],
        };
      });

      return res.status(200).json({
        success: true,
        data: { users: usersWithPermissions },
        message: "Lấy danh sách người dùng và quyền thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng và quyền:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách người dùng và quyền",
      });
    }
  }

  /**
   * Cập nhật quyền của employee (chỉ admin có thể thực hiện)
   */
  static async updateEmployeePermissions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      // Permission validation is already handled by requirePermission("change_user_role") middleware

      const { userId, permissions } = req.body;

      if (!userId || !permissions) {
        return res.status(400).json({
          success: false,
          message: "UserId và permissions là bắt buộc",
        });
      }

      // Kiểm tra user có tồn tại không và phải là employee
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy người dùng",
        });
      }

      if (user.role !== "employee") {
        return res.status(400).json({
          success: false,
          message: "Chỉ có thể cập nhật quyền cho employee",
        });
      }

      // Quyền có thể quản lý cho employee
      const manageableEmployeePermissions = [
        "create_user",
        "edit_user",
        "delete_user",
        "change_user_status",
        "change_user_role",
        "create_post",
        "edit_post",
        "delete_post",
        "approve_post",
        "reject_post",
        "feature_post",
        "create_project",
        "edit_project",
        "delete_project",
        "create_news",
        "edit_news",
        "delete_news",
        "feature_news",
        "manage_news_categories",
        "view_transactions",
        "view_dashboard",
        "view_statistics",
        "export_statistics",
        "generate_reports",
        "edit_settings",
        "manage_categories",
        "manage_locations",
        "manage_areas",
        "manage_prices",
      ];

      // Quyền mặc định cho employee (không thể thay đổi)
      const defaultEmployeePermissions = [
        "view_users",
        "view_posts",
        "create_post",
        "edit_post",
        "view_projects",
        "view_news",
        "create_news",
        "edit_news",
        "feature_news",
        "publish_news",
        "view_dashboard",
        "view_settings",
        "view_locations",
      ];

      // Kiểm tra permissions có hợp lệ không (chỉ cho phép manageable permissions)
      const invalidPermissions = permissions.filter(
        (perm: string) => !manageableEmployeePermissions.includes(perm)
      );

      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Các quyền sau không được phép: ${invalidPermissions.join(
            ", "
          )}`,
        });
      }

      // Tổng hợp quyền cuối cùng (default + manageable permissions)
      const finalPermissions = [...defaultEmployeePermissions, ...permissions];

      // Cập nhật hoặc tạo mới UserPermission
      const updatedPermission = await UserPermission.findOneAndUpdate(
        { userId },
        { permissions: finalPermissions },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        data: {
          userId,
          permissions: finalPermissions,
          addedPermissions: permissions,
        },
        message: "Cập nhật quyền employee thành công",
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền employee:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật quyền employee",
      });
    }
  }

  /**
   * Lấy danh sách employee và quyền của họ
   */
  static async getEmployeesAndPermissions(
    req: AuthenticatedRequest,
    res: Response
  ) {
    try {
      // Permission validation is already handled by requirePermission("view_users") middleware

      // Lấy danh sách employee
      const employees = await User.find({ role: "employee" }).select(
        "username email status createdAt"
      );

      // Lấy quyền của từng employee
      const employeePermissions = await UserPermission.find({
        userId: { $in: employees.map((emp: any) => emp._id) },
      });

      // Quyền mặc định cho employee
      const defaultEmployeePermissions = [
        "view_users",
        "view_posts",
        "create_post",
        "edit_post",
        "view_projects",
        "create_news",
        "edit_news",
        "feature_news",
        "publish_news",
        "view_statistics",
        "view_settings",
        "view_locations",
      ];

      // Quyền có thể quản lý
      const manageableEmployeePermissions = [
        "create_user",
        "edit_user",
        "delete_user",
        "change_user_status",
        "change_user_role",
        "create_post",
        "edit_post",
        "delete_post",
        "approve_post",
        "reject_post",
        "feature_post",
        "create_project",
        "edit_project",
        "delete_project",
        "view_news",
        "create_news",
        "edit_news",
        "delete_news",
        "feature_news",
        "manage_news_categories",
        "view_transactions",
        "view_statistics",
        "export_statistics",
        "generate_reports",
        "edit_settings",
        "manage_categories",
        "manage_locations",
        "manage_areas",
        "manage_prices",
      ];

      // Map quyền vào employee
      const employeesWithPermissions = employees.map((employee: any) => {
        const empPerm = employeePermissions.find(
          (ep) => ep.userId.toString() === employee._id.toString()
        );

        const allPermissions =
          empPerm?.permissions || defaultEmployeePermissions;

        // Tách ra quyền được bật thêm (ngoài quyền mặc định)
        const enabledPermissions = allPermissions.filter(
          (perm) => !defaultEmployeePermissions.includes(perm)
        );

        return {
          ...employee.toObject(),
          permissions: allPermissions,
          defaultPermissions: defaultEmployeePermissions,
          enabledPermissions,
          manageablePermissions: manageableEmployeePermissions,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          employees: employeesWithPermissions,
          manageablePermissions: manageableEmployeePermissions,
          defaultPermissions: defaultEmployeePermissions,
        },
        message: "Lấy danh sách employee thành công",
      });
    } catch (error) {
      console.error("Lỗi khi lấy danh sách employee:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách employee",
      });
    }
  }
}
