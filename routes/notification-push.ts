import { Router } from 'express';
import { 
  sendNotification,
  registerPushToken,
  removePushToken,
  getUserTokens 
} from '../controllers/notification-push';
import validateJWT from '../middlewares/validate-jwt';

const router = Router();

// Send notification (existing route)
router.post('/send', sendNotification);

// Register/update push token for authenticated user
router.post('/register-token', [validateJWT], registerPushToken);

// Remove push token for authenticated user
router.delete('/remove-token', [validateJWT], removePushToken);

// Get user's push tokens (useful for debugging)
router.get('/tokens', [validateJWT], getUserTokens);

export default router;
