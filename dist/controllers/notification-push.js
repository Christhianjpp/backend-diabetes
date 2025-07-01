"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTokens = exports.removePushToken = exports.registerPushToken = exports.sendNotification = void 0;
const pushNotification_1 = require("../services/pushNotification");
const notificationService = new pushNotification_1.PushNotificationService();
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokens, title, body, data } = req.body;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json({ message: 'Tokens array is required and cannot be empty' });
        return;
    }
    if (!title || !body) {
        res.status(400).json({ message: 'Title and body are required' });
        return;
    }
    try {
        const result = yield notificationService.sendNotification({
            tokens,
            title,
            body,
            data: data || {}
        });
        res.json(result);
    }
    catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.sendNotification = sendNotification;
const registerPushToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pushToken, device, deviceInfo } = req.body;
        const user = req.user; // User is set by validateJWT middleware
        // Enhanced logging
        console.log(`📱 Token registration for user: ${(user === null || user === void 0 ? void 0 : user.userName) || (user === null || user === void 0 ? void 0 : user._id)}`);
        console.log(`🔑 Device: ${device || 'unknown'}`);
        // Validation
        if (!pushToken || pushToken.trim() === '') {
            console.log('❌ Invalid or empty push token');
            res.status(400).json({ message: 'Push token is required and cannot be empty' });
            return;
        }
        if (!user) {
            console.log('❌ No authenticated user found');
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Initialize pushTokens array if it doesn't exist
        if (!user.pushTokens) {
            user.pushTokens = [];
        }
        const beforeCount = user.pushTokens.length;
        // Check if token already exists for this user
        const existingTokenIndex = user.pushTokens.findIndex((tokenObj) => tokenObj.token === pushToken);
        let actionTaken = '';
        if (existingTokenIndex !== -1) {
            // Update existing token info
            console.log('♻️  Token already exists, updating...');
            user.pushTokens[existingTokenIndex] = {
                token: pushToken,
                device: device || user.pushTokens[existingTokenIndex].device || 'unknown',
                createdAt: new Date()
            };
            actionTaken = 'updated';
        }
        else {
            // Add new token
            console.log('➕ Adding new token...');
            user.pushTokens.push({
                token: pushToken,
                device: device || 'unknown',
                createdAt: new Date()
            });
            actionTaken = 'added';
        }
        // Keep only the last 5 tokens per user (cleanup old ones)
        if (user.pushTokens.length > 5) {
            console.log(`🧹 Cleaning up old tokens (${user.pushTokens.length} -> 5)`);
            user.pushTokens = user.pushTokens
                .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                .slice(0, 5);
        }
        yield user.save();
        const afterCount = user.pushTokens.length;
        console.log(`✅ Token ${actionTaken} successfully. Tokens: ${beforeCount} -> ${afterCount}`);
        res.json({
            message: `Push token ${actionTaken} successfully`,
            tokenCount: user.pushTokens.length,
            action: actionTaken
        });
    }
    catch (error) {
        console.error('❌ Error in registerPushToken:', error);
        // Handle specific MongoDB validation errors
        if (error.name === 'ValidationError') {
            res.status(400).json({
                message: 'Token validation failed',
                details: error.message
            });
        }
        else {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});
exports.registerPushToken = registerPushToken;
const removePushToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pushToken } = req.body;
        const user = req.user; // User is set by validateJWT middleware
        // Enhanced logging
        console.log(`🗑️  Token removal for user: ${(user === null || user === void 0 ? void 0 : user.userName) || (user === null || user === void 0 ? void 0 : user._id)}`);
        // Validation
        if (!pushToken || pushToken.trim() === '') {
            console.log('❌ Invalid or empty push token');
            res.status(400).json({ message: 'Push token is required and cannot be empty' });
            return;
        }
        if (!user) {
            console.log('❌ No authenticated user found');
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Initialize pushTokens array if it doesn't exist
        if (!user.pushTokens) {
            user.pushTokens = [];
        }
        const beforeCount = user.pushTokens.length;
        console.log(`📊 User has ${beforeCount} tokens before removal`);
        // Remove the token
        user.pushTokens = user.pushTokens.filter((tokenObj) => tokenObj.token !== pushToken);
        const afterCount = user.pushTokens.length;
        const tokensRemoved = beforeCount - afterCount;
        yield user.save();
        if (tokensRemoved > 0) {
            console.log(`✅ Successfully removed ${tokensRemoved} token(s). Remaining: ${afterCount}`);
        }
        else {
            console.log(`⚠️  Token not found in user's collection`);
        }
        res.json({
            message: tokensRemoved > 0 ? 'Push token removed successfully' : 'Token not found',
            tokenCount: user.pushTokens.length,
            tokensRemoved
        });
    }
    catch (error) {
        console.error('❌ Error in removePushToken:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.removePushToken = removePushToken;
const getUserTokens = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user; // User is set by validateJWT middleware
        if (!user) {
            res.status(401).json({ message: 'User not authenticated' });
            return;
        }
        // Initialize pushTokens array if it doesn't exist
        if (!user.pushTokens) {
            user.pushTokens = [];
        }
        // Return tokens without exposing full token strings (for security)
        const tokensInfo = user.pushTokens.map((tokenObj) => ({
            device: tokenObj.device,
            createdAt: tokenObj.createdAt,
            tokenPreview: tokenObj.token.substring(0, 10) + '...'
        }));
        res.json({
            tokens: tokensInfo,
            count: user.pushTokens.length
        });
    }
    catch (error) {
        console.error('Error getting user tokens:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getUserTokens = getUserTokens;
//# sourceMappingURL=notification-push.js.map