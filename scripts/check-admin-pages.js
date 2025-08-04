const fs = require("fs");
const path = require("path");

// Base admin directory
const ADMIN_BASE_PATH =
  "e:\\real-estate\\real-estate-front-end\\src\\app\\admin";

// List of expected admin pages from our sidebar config
const expectedAdminPages = [
  "/admin", // Main dashboard (page.tsx in admin folder)
  "/admin/thong-ke",
  "/admin/quan-ly-tin-dang",
  "/admin/quan-ly-tin-tuc",
  "/admin/quan-ly-danh-muc",
  "/admin/news",
  "/admin/quan-ly-nguoi-dung",
  "/admin/quan-ly-lien-he",
  "/admin/quan-ly-chu-dau-tu",
  "/admin/quan-ly-du-an",
  "/admin/quan-ly-dia-chinh",
  "/admin/quan-ly-dien-tich",
  "/admin/areas",
  "/admin/quan-ly-gia",
  "/admin/quan-ly-giao-dich",
  "/admin/quan-ly-gia-tin-dang",
  "/admin/cai-dat",
  "/admin/cai-dat-header",
  "/admin/cau-hinh-sidebar",
];

function checkAdminPageExists(pagePath) {
  // Convert URL path to file system path
  let fsPath;

  if (pagePath === "/admin") {
    // Main admin page
    fsPath = path.join(ADMIN_BASE_PATH, "page.tsx");
  } else {
    // Remove /admin prefix and check for folder with page.tsx
    const relativePath = pagePath.replace("/admin/", "");
    fsPath = path.join(ADMIN_BASE_PATH, relativePath, "page.tsx");
  }

  const exists = fs.existsSync(fsPath);
  return { path: pagePath, fsPath, exists };
}

function checkAllAdminPages() {
  console.log("🔍 Checking admin page availability...\n");
  console.log(`📁 Base admin path: ${ADMIN_BASE_PATH}\n`);

  const results = expectedAdminPages.map(checkAdminPageExists);

  const existingPages = results.filter((r) => r.exists);
  const missingPages = results.filter((r) => !r.exists);

  console.log(`✅ Existing pages (${existingPages.length}/${results.length}):`);
  existingPages.forEach((page) => {
    console.log(
      `   ✅ ${page.path} → ${path.relative(process.cwd(), page.fsPath)}`
    );
  });

  if (missingPages.length > 0) {
    console.log(`\n❌ Missing pages (${missingPages.length}):`);
    missingPages.forEach((page) => {
      console.log(
        `   ❌ ${page.path} → ${path.relative(process.cwd(), page.fsPath)}`
      );
    });

    console.log("\n💡 To create missing pages, you can:");
    console.log("   1. Create the missing folders");
    console.log("   2. Add page.tsx files in each folder");
    console.log(
      "   3. Or update the sidebar config to point to existing pages"
    );
  } else {
    console.log("\n🎉 All admin pages exist!");
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Available: ${existingPages.length} pages`);
  console.log(`   ❌ Missing: ${missingPages.length} pages`);
  console.log(`   📋 Total: ${results.length} pages`);
  console.log(
    `   📈 Coverage: ${Math.round(
      (existingPages.length / results.length) * 100
    )}%`
  );

  return { existingPages, missingPages, results };
}

function generateMissingPagesScript(missingPages) {
  if (missingPages.length === 0) return;

  console.log("\n📝 PowerShell script to create missing pages:");
  console.log("-------------------------------------------");

  missingPages.forEach((page) => {
    const folderPath = path.dirname(page.fsPath);
    const relativeFolderPath = path.relative(process.cwd(), folderPath);
    const relativeFilePath = path.relative(process.cwd(), page.fsPath);

    console.log(`# Create ${page.path}`);
    console.log(
      `New-Item -ItemType Directory -Path "${relativeFolderPath}" -Force`
    );
    console.log(`@"`);
    console.log(
      `export default function ${page.path
        .split("/")
        .pop()
        .replace(/-/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")}Page() {`
    );
    console.log(`  return (`);
    console.log(`    <div className="p-6">`);
    console.log(
      `      <h1 className="text-2xl font-bold mb-4">${page.path}</h1>`
    );
    console.log(`      <p>Trang đang được phát triển...</p>`);
    console.log(`    </div>`);
    console.log(`  );`);
    console.log(`}`);
    console.log(`"@ | Out-File -FilePath "${relativeFilePath}" -Encoding UTF8`);
    console.log("");
  });
}

// Run the check
if (require.main === module) {
  const { existingPages, missingPages } = checkAllAdminPages();
  generateMissingPagesScript(missingPages);
}

module.exports = {
  checkAdminPageExists,
  checkAllAdminPages,
  expectedAdminPages,
};
