#!/usr/bin/env node

/**
 * Script để tạo báo cáo tổng kết việc implement permission system theo admin-page.prompt.md
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_PATH = path.join(
  __dirname,
  "../../real-estate-front-end/src/app/admin"
);

function findAdminPages() {
  const adminPages = [];

  function scanDirectory(dir, basePath = "") {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, relativePath);
      } else if (item === "page.tsx") {
        adminPages.push({
          path: relativePath.replace("page.tsx", "").replace(/\\/g, "/"),
          fullPath: fullPath,
          directory: path.dirname(relativePath),
        });
      }
    }
  }

  scanDirectory(FRONTEND_PATH);
  return adminPages;
}

function checkPagePermissions(pagePath) {
  try {
    const content = fs.readFileSync(pagePath, "utf8");

    const hasPagePermissionGuard = content.includes("PagePermissionGuard");
    const hasPermissionGuard = content.includes("PermissionGuard");
    const hasProtectedWrapper = content.includes(
      "export default function Protected"
    );

    // Extract permissions used
    const permissionMatches =
      content.match(/PERMISSIONS\.[A-Z_]+\.[A-Z_]+/g) || [];
    const permissions = [...new Set(permissionMatches)];

    // Check if it returns permission denied message
    const hasPermissionDenied =
      content.includes("Bạn không có quyền truy cập trang này") ||
      content.includes("Access denied") ||
      content.includes("Không có quyền");

    return {
      hasPagePermissionGuard,
      hasPermissionGuard,
      hasProtectedWrapper,
      permissions,
      hasPermissionDenied,
      isProtected: hasPagePermissionGuard || hasProtectedWrapper,
    };
  } catch (error) {
    return {
      hasPagePermissionGuard: false,
      hasPermissionGuard: false,
      hasProtectedWrapper: false,
      permissions: [],
      hasPermissionDenied: false,
      isProtected: false,
      error: error.message,
    };
  }
}

function generateReport() {
  console.log("🔍 Analyzing Admin Pages for Permission Implementation...\n");

  const adminPages = findAdminPages();
  const report = {
    totalPages: adminPages.length,
    protectedPages: 0,
    unprotectedPages: 0,
    pages: [],
  };

  console.log(`📄 Found ${adminPages.length} admin pages\n`);

  for (const page of adminPages) {
    const analysis = checkPagePermissions(page.fullPath);

    const pageReport = {
      path: page.path,
      directory: page.directory,
      ...analysis,
    };

    report.pages.push(pageReport);

    if (analysis.isProtected) {
      report.protectedPages++;
    } else {
      report.unprotectedPages++;
    }

    // Display analysis
    const status = analysis.isProtected ? "✅" : "❌";
    const guards = [];
    if (analysis.hasPagePermissionGuard) guards.push("PagePermissionGuard");
    if (analysis.hasPermissionGuard) guards.push("PermissionGuard");
    if (analysis.hasProtectedWrapper) guards.push("ProtectedWrapper");

    console.log(`${status} /${page.path}`);
    if (guards.length > 0) {
      console.log(`   Guards: ${guards.join(", ")}`);
    }
    if (analysis.permissions.length > 0) {
      console.log(`   Permissions: ${analysis.permissions.join(", ")}`);
    }
    if (analysis.error) {
      console.log(`   ❗ Error: ${analysis.error}`);
    }
    console.log("");
  }

  // Summary
  console.log("📊 Summary:");
  console.log(`   Total pages: ${report.totalPages}`);
  console.log(`   Protected pages: ${report.protectedPages} ✅`);
  console.log(
    `   Unprotected pages: ${report.unprotectedPages} ${
      report.unprotectedPages > 0 ? "❌" : "✅"
    }`
  );
  console.log(
    `   Protection rate: ${Math.round(
      (report.protectedPages / report.totalPages) * 100
    )}%`
  );

  if (report.unprotectedPages > 0) {
    console.log("\n⚠️  Unprotected pages that need attention:");
    report.pages
      .filter((p) => !p.isProtected)
      .forEach((p) => console.log(`   - /${p.path}`));
  }

  // Recommendations
  console.log("\n💡 Recommendations:");
  if (report.unprotectedPages === 0) {
    console.log("   ✅ All admin pages are properly protected!");
    console.log("   ✅ Permission system implementation is complete");
  } else {
    console.log("   🔧 Add PagePermissionGuard to unprotected pages");
    console.log("   🔧 Define appropriate permissions for each page");
    console.log("   🔧 Test with employee accounts to verify access control");
  }

  console.log("\n🎯 Next Steps:");
  console.log("   1. Test with employee account to verify statistics access");
  console.log("   2. Test permission toggles in employee-permissions page");
  console.log(
    '   3. Verify "Bạn không có quyền truy cập trang này" message displays correctly'
  );
  console.log("   4. Check that buttons/features hide for unauthorized users");

  return report;
}

// Run the analysis
generateReport();
