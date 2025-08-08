#!/usr/bin/env node

/**
 * Script để fix vòng lặp vô tận trong admin pages bằng cách thêm redirectTo="/admin/unauthorized"
 */

const fs = require("fs");
const path = require("path");

const FRONTEND_PATH = path.join(
  __dirname,
  "../../real-estate-front-end/src/app/admin"
);

function findAndFixAdminPages() {
  const filesToFix = [];

  function scanDirectory(dir, basePath = "") {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(basePath, item);

      if (fs.statSync(fullPath).isDirectory()) {
        // Skip unauthorized directory (we just created it)
        if (item !== "unauthorized") {
          scanDirectory(fullPath, relativePath);
        }
      } else if (item === "page.tsx") {
        filesToFix.push({
          path: relativePath.replace("page.tsx", "").replace(/\\/g, "/"),
          fullPath: fullPath,
          directory: path.dirname(relativePath),
        });
      }
    }
  }

  scanDirectory(FRONTEND_PATH);
  return filesToFix;
}

function fixPageFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Check if file uses PagePermissionGuard and doesn't already have redirectTo
    if (
      content.includes("PagePermissionGuard") &&
      !content.includes("redirectTo=") &&
      !filePath.includes("unauthorized")
    ) {
      console.log(`🔧 Fixing ${filePath}...`);

      // Pattern to match PagePermissionGuard without redirectTo
      const guardPattern = /(<PagePermissionGuard[^>]*)(>)/;

      if (guardPattern.test(content)) {
        const newContent = content.replace(
          guardPattern,
          '$1\n      redirectTo="/admin/unauthorized"$2'
        );

        fs.writeFileSync(filePath, newContent, "utf8");
        console.log(`   ✅ Added redirectTo="/admin/unauthorized"`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log("🔄 Fixing Admin Pages to Prevent Infinite Loop...\n");

  const adminPages = findAndFixAdminPages();
  let fixedCount = 0;

  console.log(`📄 Found ${adminPages.length} admin pages\n`);

  for (const page of adminPages) {
    if (fixPageFile(page.fullPath)) {
      fixedCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Total pages checked: ${adminPages.length}`);
  console.log(`   Pages fixed: ${fixedCount}`);
  console.log(`   Pages unchanged: ${adminPages.length - fixedCount}`);

  if (fixedCount > 0) {
    console.log("\n🎉 Fixed infinite loop issue!");
    console.log(
      "   - All admin pages now redirect to /admin/unauthorized when access denied"
    );
    console.log("   - Employees without permission will see proper error page");
    console.log("   - No more infinite redirect loops");
  } else {
    console.log("\n✅ No pages needed fixing");
  }
}

// Run the fix
main();
