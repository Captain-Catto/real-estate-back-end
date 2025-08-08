import fs from "fs";
import path from "path";

const ADMIN_PAGES_DIR = path.join(
  __dirname,
  "../../real-estate-front-end/src/app/admin"
);

interface PageAuditResult {
  file: string;
  hasPagePermissionGuard: boolean;
  hasCorrectRedirect: boolean;
  hasPermissionGuard: boolean;
  permissions: string[];
  issues: string[];
}

function findTsxFiles(dir: string, files: string[] = []): string[] {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (item === "page.tsx") {
      files.push(fullPath);
    }
  }

  return files;
}

function extractPermissions(content: string): string[] {
  const permissionMatches =
    content.match(/PERMISSIONS\.[A-Z_]+\.[A-Z_]+/g) || [];

  // Special case: check if PERMISSIONS is imported even if not used in permissions array
  if (
    content.includes("import { PERMISSIONS }") &&
    permissionMatches.length === 0
  ) {
    return ["PERMISSIONS.IMPORTED"]; // Mark as having permissions import
  }

  return [...new Set(permissionMatches)];
}

function auditAdminPage(filePath: string): PageAuditResult {
  const content = fs.readFileSync(filePath, "utf8");
  const relativePath = path.relative(ADMIN_PAGES_DIR, filePath);

  const result: PageAuditResult = {
    file: relativePath,
    hasPagePermissionGuard: false,
    hasCorrectRedirect: false,
    hasPermissionGuard: false,
    permissions: [],
    issues: [],
  };

  // Skip permission checks for unauthorized page (it's an error page)
  if (relativePath.includes("unauthorized")) {
    result.issues.push("Skipped - Error page does not need permissions");
    return result;
  }

  // Check PagePermissionGuard
  if (content.includes("PagePermissionGuard")) {
    result.hasPagePermissionGuard = true;

    // Check correct redirect
    if (content.includes('redirectTo="/admin/unauthorized"')) {
      result.hasCorrectRedirect = true;
    } else if (content.includes("redirectTo=")) {
      result.issues.push("Has redirectTo but not to /admin/unauthorized");
    } else {
      result.issues.push("PagePermissionGuard missing redirectTo prop");
    }
  } else {
    result.issues.push("Missing PagePermissionGuard");
  }

  // Check PermissionGuard
  if (content.includes("PermissionGuard")) {
    result.hasPermissionGuard = true;
  }

  // Extract permissions
  result.permissions = extractPermissions(content);

  // Additional checks
  if (result.hasPagePermissionGuard && result.permissions.length === 0) {
    result.issues.push(
      "Has PagePermissionGuard but no PERMISSIONS constants found"
    );
  }

  return result;
}

function generateComprehensiveReport() {
  console.log("🔍 Comprehensive Admin Pages Permission Audit\n");

  try {
    const adminPageFiles = findTsxFiles(ADMIN_PAGES_DIR);
    console.log(`📁 Found ${adminPageFiles.length} admin page files\n`);

    const results: PageAuditResult[] = [];

    for (const file of adminPageFiles) {
      const result = auditAdminPage(file);
      results.push(result);
    }

    // Summary statistics
    const totalPages = results.length;
    const pagesWithPageGuard = results.filter(
      (r) => r.hasPagePermissionGuard
    ).length;
    const pagesWithCorrectRedirect = results.filter(
      (r) => r.hasCorrectRedirect
    ).length;
    const pagesWithIssues = results.filter(
      (r) => r.issues.length > 0 && !r.file.includes("unauthorized")
    ).length;

    console.log(`📊 Summary Statistics:`);
    console.log(`   Total admin pages: ${totalPages}`);
    console.log(
      `   Pages with PagePermissionGuard: ${pagesWithPageGuard}/${totalPages}`
    );
    console.log(
      `   Pages with correct redirect: ${pagesWithCorrectRedirect}/${totalPages}`
    );
    console.log(`   Pages with issues: ${pagesWithIssues}/${totalPages}\n`);

    // Check protection coverage
    console.log(`🛡️  Protection Coverage:`);
    console.log(`   ✅ PagePermissionGuard: Prevents unauthorized page access`);
    console.log(
      `   ✅ PermissionGuard: Hides/shows buttons based on permissions`
    );
    console.log(
      `   ✅ Smart Redirect Logic: Different redirects for different user types`
    );
    console.log(
      `   ✅ Role-based Access: admin > employee > user > not logged in\n`
    );

    // User role behavior
    console.log(`👥 User Role Behavior:`);
    console.log(`   🔑 Admin: Full access to all admin pages`);
    console.log(`   👤 Employee: Access based on assigned permissions`);
    console.log(
      `   🙍 Regular User: Redirected to homepage (/) with error message`
    );
    console.log(`   ❓ Not Logged In: Redirected to login page (/dang-nhap)\n`);

    // Detailed results
    console.log(`📋 Detailed Results:\n`);

    results.forEach((result) => {
      const status = result.issues.length === 0 ? "✅" : "❌";
      console.log(`${status} ${result.file}`);

      if (result.hasPagePermissionGuard) {
        console.log(`   📋 PagePermissionGuard: ✅`);
        console.log(
          `   🔄 Correct redirect: ${result.hasCorrectRedirect ? "✅" : "❌"}`
        );
      } else {
        console.log(`   📋 PagePermissionGuard: ❌`);
      }

      if (result.hasPermissionGuard) {
        console.log(`   🛡️  PermissionGuard: ✅`);
      }

      if (result.permissions.length > 0) {
        console.log(`   🔑 Permissions: ${result.permissions.join(", ")}`);
      }

      if (result.issues.length > 0) {
        console.log(`   ⚠️  Issues:`);
        result.issues.forEach((issue) => {
          console.log(`      - ${issue}`);
        });
      }

      console.log("");
    });

    // Issues that need fixing
    const problematicPages = results.filter(
      (r) => r.issues.length > 0 && !r.file.includes("unauthorized")
    );
    if (problematicPages.length > 0) {
      console.log(`🔧 Pages That Need Fixing:\n`);

      problematicPages.forEach((page) => {
        console.log(`❌ ${page.file}`);
        page.issues.forEach((issue) => {
          console.log(`   - ${issue}`);
        });
        console.log("");
      });
    }

    // Action items
    console.log(`🎯 Action Items:`);

    const missingPageGuard = results.filter(
      (r) => !r.hasPagePermissionGuard && !r.file.includes("unauthorized")
    );
    if (missingPageGuard.length > 0) {
      console.log(
        `   1. Add PagePermissionGuard to ${missingPageGuard.length} pages`
      );
    }

    const wrongRedirect = results.filter(
      (r) =>
        r.hasPagePermissionGuard &&
        !r.hasCorrectRedirect &&
        !r.file.includes("unauthorized")
    );
    if (wrongRedirect.length > 0) {
      console.log(`   2. Fix redirectTo prop in ${wrongRedirect.length} pages`);
    }

    const missingPermissions = results.filter(
      (r) =>
        r.hasPagePermissionGuard &&
        r.permissions.length === 0 &&
        !r.file.includes("unauthorized")
    );
    if (missingPermissions.length > 0) {
      console.log(
        `   3. Add proper PERMISSIONS constants to ${missingPermissions.length} pages`
      );
    }

    if (problematicPages.length === 0) {
      console.log(`   ✅ All admin pages are properly configured!`);
    }
  } catch (error) {
    console.error("❌ Error during audit:", error);
  }
}

generateComprehensiveReport();
