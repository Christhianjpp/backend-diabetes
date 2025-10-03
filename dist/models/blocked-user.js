"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BlockedUserSchema = new mongoose_1.Schema({
    blockerId: {
        type: String,
        required: [true, 'Blocker ID is required'],
        ref: 'User',
    },
    blockedUserId: {
        type: String,
        required: [true, 'Blocked user ID is required'],
        ref: 'User',
    },
    blockedUserName: {
        type: String,
        required: [true, 'Blocked user name is required'],
    },
    blockedUserImg: {
        type: String,
    },
    reason: {
        type: String,
        maxlength: [200, 'Reason cannot exceed 200 characters'],
    },
    createdAt: {
        type: Number,
        required: [true, 'Created at is required'],
        default: Date.now,
    },
});
// Índices para optimizar consultas
BlockedUserSchema.index({ blockerId: 1, createdAt: -1 });
BlockedUserSchema.index({ blockedUserId: 1, createdAt: -1 });
// Evitar bloqueos duplicados del mismo usuario
BlockedUserSchema.index({ blockerId: 1, blockedUserId: 1 }, { unique: true });
const BlockedUser = (0, mongoose_1.model)('BlockedUser', BlockedUserSchema);
exports.default = BlockedUser;
//# sourceMappingURL=blocked-user.js.map