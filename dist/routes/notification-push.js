"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_push_1 = require("../controllers/notification-push");
const validate_jwt_1 = __importDefault(require("../middlewares/validate-jwt"));
const router = (0, express_1.Router)();
// Send notification (existing route)
router.post('/send', notification_push_1.sendNotification);
// Send notification to specific user by ID
router.post('/send-to-user', 
//  [validateJWT], 
notification_push_1.sendNotificationToUser);
// Send notification to all users (admin only)
router.post('/send-to-all', 
// [validateJWT, isAdminRole],
notification_push_1.sendNotificationToAllUsers);
// Register/update push token for authenticated user
router.post('/register-token', [validate_jwt_1.default], notification_push_1.registerPushToken);
// Remove push token for authenticated user
router.delete('/remove-token', [validate_jwt_1.default], notification_push_1.removePushToken);
// Get user's push tokens (useful for debugging)
router.get('/tokens', [validate_jwt_1.default], notification_push_1.getUserTokens);
// Get all users tokens with detailed information (admin only)
router.get('/all-tokens', 
//  [validateJWT, isAdminRole],
notification_push_1.getAllUsersTokens);
// Get all users tokens only (admin only)
router.get('/all-tokens-only', 
//  [validateJWT, isAdminRole],
notification_push_1.getAllUsersTokensOnly);
exports.default = router;
//# sourceMappingURL=notification-push.js.map