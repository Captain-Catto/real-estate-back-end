// Debug script để test redirect logic
console.log("🔍 Debug ProtectionGuard Loading Issue...\n");

// Kiểm tra browser console để debug
const testRedirectLogic = () => {
  console.log("📊 Testing redirect logic in browser console:");
  console.log("");
  console.log("1. Kiểm tra user state:");
  console.log('   - localStorage.getItem("accessToken")');
  console.log("   - document.cookie (check auth cookies)");
  console.log("");
  console.log("2. Kiểm tra Redux state:");
  console.log(
    "   - window.__REDUX_DEVTOOLS_EXTENSION__ && window.store.getState()"
  );
  console.log("");
  console.log("3. Kiểm tra network requests:");
  console.log("   - F12 → Network tab → XHR/Fetch");
  console.log("   - Look for /api/auth/profile hoặc permission calls");
  console.log("");
  console.log("4. Kiểm tra console errors:");
  console.log("   - F12 → Console tab → Check for errors");
  console.log("");
  console.log("5. Test cases:");
  console.log("   A. Không login:");
  console.log('      - localStorage.removeItem("accessToken")');
  console.log(
    '      - document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"'
  );
  console.log("      - Refresh page → Should redirect to /dang-nhap");
  console.log("");
  console.log("   B. Login with regular user:");
  console.log("      - Login as user1@gmail.com");
  console.log("      - Navigate to /admin");
  console.log("      - Should redirect to / (homepage)");
  console.log("");
  console.log("   C. Login with admin:");
  console.log("      - Login as admin@gmail.com");
  console.log("      - Navigate to /admin");
  console.log("      - Should show admin dashboard");
};

testRedirectLogic();

export default testRedirectLogic;
