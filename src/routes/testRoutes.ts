import { Router } from 'express';
import { webSocketService } from '../services/WebSocketService';

const router = Router();

// Test endpoint để check WebSocket service status
router.get('/websocket-status', (req, res) => {
  try {
    const connectedUsers = webSocketService.getConnectedUsersCount();
    const server = webSocketService.getServer();
    
    res.json({
      success: true,
      data: {
        isInitialized: !!server,
        connectedUsers: connectedUsers,
        connectedUsersList: webSocketService.getConnectedUsers(),
        serverStatus: server ? 'running' : 'not initialized'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking WebSocket status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint để broadcast message tới tất cả users (for testing)
router.post('/broadcast-test', (req, res) => {
  try {
    const { message } = req.body;
    
    webSocketService.broadcastToAll('test-broadcast', {
      message: message || 'Test broadcast message',
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Broadcast sent to all connected users'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error broadcasting message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;