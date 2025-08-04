#!/usr/bin/env node

/**
 * Quick sidebar configuration test script
 * Tạo sidebar config mẫu để test
 */

const path = require("path");
const fs = require("fs");

// Simple sidebar config for testing
const quickTestConfig = {
  name: "Quick Test Sidebar",
  isDefault: true,
  groups: [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: "HomeIcon",
      items: [
        {
          id: "home",
          name: "Trang chủ",
          href: "/admin",
          icon: "HomeIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Trang chủ admin",
        },
        {
          id: "stats",
          name: "Thống kê",
          href: "/admin/thong-ke",
          icon: "ChartBarIcon",
          order: 2,
          isActive: true,
          roles: ["admin"],
          description: "Xem thống kê",
          badge: "Hot",
        },
      ],
      isCollapsible: false,
      defaultExpanded: true,
    },
    {
      id: "content",
      name: "Nội dung",
      icon: "DocumentTextIcon",
      items: [
        {
          id: "posts",
          name: "Tin đăng",
          href: "/admin/tin-dang",
          icon: "DocumentTextIcon",
          order: 1,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý tin đăng",
        },
        {
          id: "news",
          name: "Tin tức",
          href: "/admin/tin-tuc",
          icon: "NewspaperIcon",
          order: 2,
          isActive: true,
          roles: ["admin", "employee"],
          description: "Quản lý tin tức",
        },
      ],
      isCollapsible: true,
      defaultExpanded: true,
    },
    {
      id: "settings",
      name: "Cài đặt",
      icon: "CogIcon",
      items: [
        {
          id: "config",
          name: "Cấu hình",
          href: "/admin/cau-hinh",
          icon: "CogIcon",
          order: 1,
          isActive: true,
          roles: ["admin"],
          description: "Cài đặt hệ thống",
        },
      ],
      isCollapsible: true,
      defaultExpanded: false,
    },
  ],
};

function saveTestConfig() {
  try {
    // Save to JSON file for quick reference
    const outputPath = path.join(__dirname, "test-sidebar-config.json");
    fs.writeFileSync(outputPath, JSON.stringify(quickTestConfig, null, 2));

    console.log("✅ Quick test sidebar config created!");
    console.log(`📁 File saved to: ${outputPath}`);
    console.log("\n📊 Config Summary:");
    console.log(`   📁 Groups: ${quickTestConfig.groups.length}`);

    const totalItems = quickTestConfig.groups.reduce(
      (total, group) => total + group.items.length,
      0
    );
    console.log(`   📋 Total items: ${totalItems}`);

    console.log("\n👥 Role access:");
    ["admin", "employee"].forEach((role) => {
      const accessCount = quickTestConfig.groups.reduce((total, group) => {
        return (
          total + group.items.filter((item) => item.roles.includes(role)).length
        );
      }, 0);
      console.log(`   ${role}: ${accessCount} items`);
    });

    console.log("\n🎯 You can use this config to:");
    console.log("   1. Test your sidebar component");
    console.log("   2. Import into your database");
    console.log("   3. Use as a template for custom configs");

    return quickTestConfig;
  } catch (error) {
    console.error("❌ Error creating test config:", error);
    return null;
  }
}

// Generate test data for API testing
function generateAPITestData() {
  const apiTestData = {
    success: true,
    data: {
      id: "test-config-001",
      groups: quickTestConfig.groups,
      lastModified: new Date().toISOString(),
      version: 1,
    },
    message: "Test sidebar configuration loaded successfully",
  };

  const apiPath = path.join(__dirname, "api-test-response.json");
  fs.writeFileSync(apiPath, JSON.stringify(apiTestData, null, 2));

  console.log(`\n🔧 API test response saved to: ${apiPath}`);
  console.log("💡 You can use this to mock API responses during development");
}

// Main execution
if (require.main === module) {
  console.log("🚀 Creating quick test sidebar configuration...\n");

  const config = saveTestConfig();
  if (config) {
    generateAPITestData();

    console.log("\n✨ All test files created successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Run the full populate script: npm run populate");
    console.log("   2. Or manually import test-sidebar-config.json");
    console.log("   3. Start your backend server to test API integration");
  }
}

module.exports = {
  quickTestConfig,
  saveTestConfig,
  generateAPITestData,
};
