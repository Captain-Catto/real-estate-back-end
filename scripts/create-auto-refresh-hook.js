#!/usr/bin/env node

/**
 * Script để tạo hook tự động refresh sidebar khi admin tạo nhóm mới
 */

import fs from "fs";
import path from "path";

const frontendPath = path.join(__dirname, "../../real-estate-front-end/src");

const autoRefreshHookContent = `
/**
 * Hook để tự động refresh sidebar khi có thay đổi
 * Sử dụng WebSocket hoặc polling để detect changes
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { fetchSidebarConfig, clearConfig } from '@/store/slices/sidebarSlice';
import { useAuth } from '@/hooks/useAuth';

export function useSidebarAutoRefresh() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const lastRefreshTime = useRef<number>(Date.now());
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user?.role || !['admin', 'employee'].includes(user.role)) {
      return;
    }

    // Function to check for sidebar updates
    const checkForUpdates = async () => {
      try {
        const response = await fetch(\`http://localhost:8080/api/admin/sidebar/last-modified\`, {
          headers: {
            'Authorization': \`Bearer \${localStorage.getItem('accessToken')}\`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const serverLastModified = new Date(data.lastModified).getTime();
          
          if (serverLastModified > lastRefreshTime.current) {
            console.log('🔄 Sidebar updated, refreshing...');
            dispatch(clearConfig());
            dispatch(fetchSidebarConfig());
            lastRefreshTime.current = serverLastModified;
          }
        }
      } catch (error) {
        console.error('Failed to check sidebar updates:', error);
      }
    };

    // Start polling every 30 seconds
    refreshInterval.current = setInterval(checkForUpdates, 30000);

    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [user?.role, dispatch]);

  // Manual refresh function
  const refreshSidebar = () => {
    dispatch(clearConfig());
    dispatch(fetchSidebarConfig());
    lastRefreshTime.current = Date.now();
  };

  return { refreshSidebar };
}
`;

// Create the hook file
const hookFilePath = path.join(frontendPath, "hooks/useSidebarAutoRefresh.ts");

try {
  fs.writeFileSync(hookFilePath, autoRefreshHookContent.trim());
  console.log("✅ Created useSidebarAutoRefresh hook");
} catch (error) {
  console.error("❌ Failed to create hook:", error);
}

// Create backend endpoint for last modified check
const backendEndpointContent = `
// Add this to your SidebarController.ts

/**
 * Get last modified time of sidebar config
 */
static async getLastModified(req: Request, res: Response) {
  try {
    const sidebarConfig = await SidebarConfig.findOne({ isDefault: true });
    
    if (!sidebarConfig) {
      return res.status(404).json({
        success: false,
        message: "Sidebar config not found"
      });
    }

    res.json({
      success: true,
      lastModified: sidebarConfig.updatedAt
    });
  } catch (error) {
    console.error("Error getting last modified:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
}
`;

console.log("📝 Backend endpoint code:");
console.log(backendEndpointContent);

console.log("\\n🎯 NEXT STEPS:");
console.log("1. Add the endpoint to SidebarController.ts");
console.log(
  '2. Add route: router.get("/last-modified", SidebarController.getLastModified);'
);
console.log("3. Import useSidebarAutoRefresh in AdminSidebar.tsx");
console.log("4. Test: Admin creates group → Employee sees it within 30s");
