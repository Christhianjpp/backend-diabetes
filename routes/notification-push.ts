import { Router } from 'express';
import { 
  sendNotification,
  registerPushToken,
  removePushToken,
  getUserTokens,
  getAllUsersTokens,
  getAllUsersTokensOnly,
  sendNotificationToUser,
  sendNotificationToAllUsers
} from '../controllers/notification-push';
import validateJWT from '../middlewares/validate-jwt';
import { isAdminRole } from '../middlewares/validate-roles';

const router = Router();

// Send notification (existing route)
router.post('/send', sendNotification);

// Send notification to specific user by ID
router.post('/send-to-user', 
//  [validateJWT], 
  sendNotificationToUser);

// Send notification to all users (admin only)
router.post('/send-to-all',
   // [validateJWT, isAdminRole],
    sendNotificationToAllUsers);

// Register/update push token for authenticated user
router.post('/register-token', [validateJWT], registerPushToken);

// Remove push token for authenticated user
router.delete('/remove-token', [validateJWT], removePushToken);

// Get user's push tokens (useful for debugging)
router.get('/tokens', [validateJWT], getUserTokens);

// Get all users tokens with detailed information (admin only)
router.get('/all-tokens',
  //  [validateJWT, isAdminRole],
    getAllUsersTokens);

// Get all users tokens only (admin only)
router.get('/all-tokens-only',
  //  [validateJWT, isAdminRole],
    getAllUsersTokensOnly);

export default router;
