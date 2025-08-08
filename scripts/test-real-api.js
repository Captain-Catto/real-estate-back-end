// Test real API endpoint
const testPermissionsAPI = async () => {
  try {
    console.log("Testing real permissions API endpoint...");

    // Simulate a fetch to the permissions endpoint
    const response = await fetch("http://localhost:8080/api/permissions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // In real app, this would include authentication headers
      },
      credentials: "include", // Include cookies for auth
    });

    const data = await response.json();
    console.log("API Response Status:", response.status);
    console.log("API Response Data:", JSON.stringify(data, null, 2));

    if (data.success && data.data.permissions) {
      const permissions = data.data.permissions;
      const hasManageCategories = permissions.includes("manage_categories");
      const hasManageNewsCategories = permissions.includes(
        "manage_news_categories"
      );

      console.log("\n=== REAL API CHECK ===");
      console.log(`manage_categories: ${hasManageCategories ? "✅" : "❌"}`);
      console.log(
        `manage_news_categories: ${hasManageNewsCategories ? "✅" : "❌"}`
      );
      console.log(
        `Should allow access: ${
          hasManageCategories || hasManageNewsCategories ? "✅" : "❌"
        }`
      );
    }
  } catch (error) {
    console.error("API Test Error:", error.message);
    console.log("Make sure backend server is running on http://localhost:8080");
  }
};

// For Node.js environment, we need to install node-fetch
// For now, just show the curl command
console.log("To test the real API, run this curl command:");
console.log(
  'curl -X GET "http://localhost:8080/api/permissions" -H "Content-Type: application/json" --cookie-jar cookies.txt --cookie cookies.txt'
);
console.log("\nOr test in browser console after logging in as employee1:");
console.log(`
fetch('/api/permissions', {
  method: 'GET',
  credentials: 'include'
}).then(res => res.json()).then(data => {
  console.log('Permissions:', data);
  const permissions = data.data?.permissions || [];
  console.log('Has manage_categories:', permissions.includes('manage_categories'));
  console.log('Has manage_news_categories:', permissions.includes('manage_news_categories'));
});
`);
