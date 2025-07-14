// Using built-in fetch (Node.js 18+)

const API_BASE_URL = "http://localhost:8080/api";

// Test function
const testPackageAPI = async () => {
  try {
    console.log("🧪 Testing Package API...");

    // Test 1: Get active packages (public)
    console.log("\n1. Testing GET /api/packages (public)");
    const getResponse = await fetch(`${API_BASE_URL}/packages`);
    const getResult = await getResponse.json();

    if (getResult.success) {
      console.log(
        `✅ Success: Found ${getResult.data.packages.length} packages`
      );
      const firstPackage = getResult.data.packages[0];
      console.log(
        `   First package: ${firstPackage.name} (id: ${firstPackage.id})`
      );
    } else {
      console.log("❌ Failed to get packages");
    }

    // Test 2: Try to update a package (without auth - should fail)
    console.log("\n2. Testing PUT /api/admin/packages/basic (without auth)");
    const updateResponse = await fetch(`${API_BASE_URL}/admin/packages/basic`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Gói Cơ Bản Updated",
        price: 55000,
        duration: 30,
        features: ["Test feature"],
        priority: "normal",
        isActive: true,
      }),
    });

    const updateResult = await updateResponse.json();
    console.log(`Status: ${updateResponse.status}`);
    console.log(`Response:`, updateResult);

    if (updateResponse.status === 401 || updateResponse.status === 403) {
      console.log("✅ Correctly rejected unauthorized request");
    } else {
      console.log("❌ Should have rejected unauthorized request");
    }

    // Test 3: Try to get package by ID
    console.log("\n3. Testing GET /api/admin/packages/basic (without auth)");
    const getByIdResponse = await fetch(`${API_BASE_URL}/admin/packages/basic`);
    const getByIdResult = await getByIdResponse.json();
    console.log(`Status: ${getByIdResponse.status}`);
    console.log(`Response:`, getByIdResult);

    // Test 4: Check current packages structure
    console.log("\n4. Checking current packages structure");
    if (getResult.success && getResult.data.packages.length > 0) {
      const samplePackage = getResult.data.packages[0];
      console.log("Sample package structure:");
      console.log("- Has id:", !!samplePackage.id);
      console.log("- Has _id:", !!samplePackage._id);
      console.log(
        "- Has isPopular:",
        !!samplePackage.hasOwnProperty("isPopular")
      );
      console.log("- Has color:", !!samplePackage.hasOwnProperty("color"));
      console.log(
        "- Has maxPosts:",
        !!samplePackage.hasOwnProperty("maxPosts")
      );
      console.log(
        "- Has maxImages:",
        !!samplePackage.hasOwnProperty("maxImages")
      );
      console.log("- isPopular value:", samplePackage.isPopular);
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
};

// Run the test
testPackageAPI();
