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
exports.PushNotificationService = void 0;
const expo_server_sdk_1 = require("expo-server-sdk");
class PushNotificationService {
    constructor() {
        this.expo = new expo_server_sdk_1.Expo({ useFcmV1: true });
    }
    sendNotification(_a) {
        return __awaiter(this, arguments, void 0, function* ({ tokens, title, body, data = {} }) {
            const areExpoTokens = tokens.every(expo_server_sdk_1.Expo.isExpoPushToken);
            if (!areExpoTokens) {
                throw new Error('Invalid Expo push token');
            }
            const messages = tokens.map((token) => ({
                to: token,
                sound: 'default',
                title,
                body,
                data,
            }));
            const chunks = this.expo.chunkPushNotifications(messages);
            const tickets = [];
            for (const chunk of chunks) {
                try {
                    const ticketChunk = yield this.expo.sendPushNotificationsAsync(chunk);
                    tickets.push(ticketChunk);
                }
                catch (error) {
                    console.error('Error sending notifications:', error);
                    throw new Error('Error sending notifications');
                }
            }
            return { done: true, tickets };
        });
    }
}
exports.PushNotificationService = PushNotificationService;
//# sourceMappingURL=pushNotification.js.map