// Export all validation schemas and middleware
export * from "./common";

// Auth validations
export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  adminCreateUserSchema,
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
  type ResetPasswordRequestInput,
  type ResetPasswordInput,
  type UpdateProfileInput,
  type VerifyEmailInput,
  type RefreshTokenInput,
  type AdminCreateUserInput,
} from "./authValidation";

// Property validations
export * from "./propertyValidation";

// Post validations
export * from "./postValidation";

// User validations (avoiding conflicts)
export {
  updateUserProfileSchema,
  userSearchSchema,
  banUserSchema,
  assignRoleSchema,
  updatePermissionsSchema,
  userStatsQuerySchema,
  bulkUserActionSchema,
  userActivityQuerySchema,
  notificationPreferencesSchema,
  type UpdateUserProfileInput,
  type UserSearchQuery,
  type BanUserInput,
  type AssignRoleInput,
  type UpdatePermissionsInput,
  type UserStatsQuery,
  type BulkUserActionInput,
  type UserActivityQuery,
  type NotificationPreferencesInput,
} from "./userValidation";

// Use auth's version for these common schemas
export {
  adminUpdateUserSchema,
  userIdParamSchema,
  type AdminUpdateUserInput,
  type UserIdParam,
} from "./authValidation";

// Export validation middleware
export * from "../middleware/validation";
