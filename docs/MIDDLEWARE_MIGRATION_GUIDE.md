# Backend Middleware Migration Guide

## Overview

The backend authentication middleware has been consolidated into a unified system. This guide explains the changes and how to migrate existing code.

## What Changed

### Before (Old System)

- `authenticateUser` - Basic user authentication
- `authenticateAdmin` - Admin role authentication
- `hasPermission`, `requirePermission`, `requireAllPermissions`, `requireAnyPermission` - Permission checking

### After (New Unified System)

- `authenticate(options)` - Single configurable middleware for all authentication needs
- Helper functions for common patterns

## New Unified Authentication

### Core Function

```typescript
authenticate({
  requireAuth?: boolean;        // Require valid token (default: true)
  requireAdmin?: boolean;       // Require admin role (default: false)
  requirePermissions?: string[]; // Required permissions
  requireAnyPermission?: boolean; // ANY vs ALL permissions (default: false = ALL)
})
```

### Helper Functions

```typescript
// Basic authentication
requireAuth; // Replaces: authenticateUser
requireAdmin; // Replaces: authenticateAdmin
optionalAuth; // New: auth optional

// Permission-based
requirePermission(permission); // Replaces: requirePermission
requireAllPermissions(permissions); // Replaces: requireAllPermissions
requireAnyPermission(permissions); // Replaces: requireAnyPermission
```

## Migration Examples

### Basic Authentication

```typescript
// OLD
router.get("/profile", authenticateUser, controller.getProfile);

// NEW - Option 1 (using helper)
router.get("/profile", requireAuth, controller.getProfile);

// NEW - Option 2 (using unified)
router.get("/profile", authenticate(), controller.getProfile);
```

### Admin Authentication

```typescript
// OLD
router.get("/admin/users", authenticateAdmin, controller.getUsers);

// NEW - Option 1 (using helper)
router.get("/admin/users", requireAdmin, controller.getUsers);

// NEW - Option 2 (using unified)
router.get(
  "/admin/users",
  authenticate({ requireAdmin: true }),
  controller.getUsers
);
```

### Permission-Based Authentication

```typescript
// OLD
router.post("/posts", requirePermission("posts.create"), controller.createPost);

// NEW - Option 1 (using helper)
router.post("/posts", requirePermission("posts.create"), controller.createPost);

// NEW - Option 2 (using unified)
router.post(
  "/posts",
  authenticate({ requirePermissions: ["posts.create"] }),
  controller.createPost
);
```

### Complex Permission Requirements

```typescript
// Multiple permissions (ALL required)
router.put(
  "/posts/:id",
  authenticate({
    requirePermissions: ["posts.update", "posts.edit"],
  }),
  controller.updatePost
);

// Multiple permissions (ANY required)
router.get(
  "/posts",
  authenticate({
    requirePermissions: ["posts.read", "posts.view"],
    requireAnyPermission: true,
  }),
  controller.getPosts
);

// Admin OR specific permission
router.delete(
  "/posts/:id",
  authenticate({
    requirePermissions: ["posts.delete"],
    requireAnyPermission: true,
  }),
  controller.deletePost
);
```

### Optional Authentication

```typescript
// User info if present, but not required
router.get("/posts/public", optionalAuth, controller.getPublicPosts);
// or
router.get(
  "/posts/public",
  authenticate({ requireAuth: false }),
  controller.getPublicPosts
);
```

## Backward Compatibility

All existing middleware functions are still available and will continue to work:

- `authenticateUser`
- `authenticateAdmin`
- `requirePermission`
- `requireAllPermissions`
- `requireAnyPermission`

These are marked as legacy and should be migrated to the new system over time.

## Benefits of New System

1. **Unified Logic**: Single middleware handles all authentication scenarios
2. **Less Code Duplication**: No repeated token extraction/verification logic
3. **Better Error Handling**: Consistent error responses across all auth scenarios
4. **More Flexible**: Complex permission combinations are easier to express
5. **Better Performance**: Single middleware call vs chaining multiple middlewares
6. **Cleaner Code**: More readable route definitions

## Migration Priority

1. **High Priority**: New routes should use the new system
2. **Medium Priority**: Routes with complex permission requirements
3. **Low Priority**: Simple routes with basic auth (can migrate gradually)

## Testing

All existing functionality should continue to work due to backward compatibility. Test your routes after migration to ensure proper behavior.
