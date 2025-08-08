// Export unified authentication system
export * from "./auth";

// Export other utility middleware
export { requestLogger, validateRequestBody } from "./index";

// Legacy exports for backward compatibility
// These are deprecated - use the unified authenticate() function instead
export {
  hasPermission,
  requirePermission as legacyRequirePermission,
  requireAllPermissions as legacyRequireAllPermissions,
  requireAnyPermission as legacyRequireAnyPermission,
} from "./permissionMiddleware";
