#!/usr/bin/env node

import fs from "fs";
import path from "path";

const statsControllerPath = path.join(
  __dirname,
  "../src/controllers/StatsController.ts"
);

function fixStatsController() {
  try {
    console.log("🔧 Fixing StatsController admin-only restrictions...\n");

    // Read the file
    let content = fs.readFileSync(statsControllerPath, "utf8");

    // Pattern to match admin role checks
    const adminCheckPattern =
      /\s*if \(req\.user\?\.role !== "admin"\) \{\s*return res\.status\(403\)\.json\(\{\s*success: false,\s*message: ".*?",?\s*\}\);\s*\}\s*/g;

    // Count matches before replacement
    const matches = content.match(adminCheckPattern);
    const matchCount = matches ? matches.length : 0;

    console.log(`📊 Found ${matchCount} admin-only checks to remove`);

    if (matchCount > 0) {
      // Replace all admin checks with a comment
      content = content.replace(
        adminCheckPattern,
        "\n      // Permission check is handled by middleware, no need for additional role check\n"
      );

      // Write back to file
      fs.writeFileSync(statsControllerPath, content, "utf8");

      console.log(
        `✅ Successfully removed ${matchCount} admin-only restrictions`
      );
      console.log(
        "✅ All statistics endpoints now respect middleware permissions"
      );
      console.log(
        "✅ Employees with view_statistics permission can now access stats APIs"
      );
    } else {
      console.log("✅ No admin-only checks found to remove");
    }
  } catch (error) {
    console.error("❌ Error fixing StatsController:", error);
  }
}

fixStatsController();
