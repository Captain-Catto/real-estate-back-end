import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTECTED_GUARD_PATH = path.join(
  __dirname,
  "../../real-estate-front-end/src/components/auth/ProtectionGuard.tsx"
);

async function addDebugLogging() {
  try {
    console.log("🔧 Adding Debug Logging to ProtectionGuard...\n");

    const content = fs.readFileSync(PROTECTED_GUARD_PATH, "utf8");

    // Add more debug logging to help identify the issue
    const updatedContent = content.replace(
      `  useEffect(() => {
    // Wait for auth and permissions to be initialized
    if (!isInitialized || permissionsLoading) {
      return;
    }`,
      `  useEffect(() => {
    console.log('🔍 ProtectionGuard useEffect:', {
      isInitialized,
      permissionsLoading,
      isAuthenticated,
      user: user ? { id: user.id, role: user.role, email: user.email } : undefined,
      userRole: user?.role,
      requireAuth,
      roles,
      permissions,
      isPageGuard
    });

    // Wait for auth and permissions to be initialized
    if (!isInitialized || permissionsLoading) {
      console.log('⏳ Waiting for initialization...', { isInitialized, permissionsLoading });
      return;
    }

    console.log('✅ Starting permission checks...');`
    );

    // Add debug at the end of useEffect
    const finalContent = updatedContent.replace(
      `    setHasAccess(accessGranted);
    setIsChecking(false);
  }, [`,
      `    console.log('📋 Final result:', { accessGranted, errorMessage });
    setHasAccess(accessGranted);
    setIsChecking(false);
  }, [`
    );

    if (finalContent === content) {
      console.log(
        "❌ No changes made - debug logging might already be present"
      );
      return;
    }

    fs.writeFileSync(PROTECTED_GUARD_PATH, finalContent, "utf8");
    console.log("✅ Debug logging added to ProtectionGuard");
    console.log("📍 File updated:", PROTECTED_GUARD_PATH);

    console.log("\n🧪 Debug Instructions:");
    console.log("1. Refresh your browser");
    console.log("2. Open browser console (F12)");
    console.log("3. Navigate to /admin");
    console.log("4. Check console for debug messages");
    console.log("5. Look for patterns in the logs to identify the issue");

    console.log("\n🔍 What to look for:");
    console.log("- Is isInitialized ever becoming true?");
    console.log("- Is permissionsLoading ever becoming false?");
    console.log("- What is the user object state?");
    console.log('- Are we stuck in the "Waiting for initialization" loop?');
  } catch (error) {
    console.error("❌ Error adding debug logging:", error);
  }
}

addDebugLogging();
