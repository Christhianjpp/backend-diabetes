"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const UserReportSchema = new mongoose_1.Schema({
    reporterId: {
        type: String,
        required: [true, 'Reporter ID is required'],
        ref: 'User',
    },
    reportedUserId: {
        type: String,
        required: [true, 'Reported user ID is required'],
        ref: 'User',
    },
    commentId: {
        type: String,
        ref: 'Comment',
    },
    noteId: {
        type: String,
        ref: 'Note',
    },
    reason: {
        type: String,
        required: [true, 'Reason is required'],
        enum: {
            values: ['spam', 'harassment', 'inappropriate_content', 'hate_speech', 'fake_information', 'other'],
            message: 'Invalid reason value',
        },
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: {
            values: ['pending', 'reviewed', 'resolved', 'dismissed'],
            message: 'Invalid status value',
        },
        default: 'pending',
    },
    createdAt: {
        type: Number,
        required: [true, 'Created at is required'],
        default: Date.now,
    },
    reviewedAt: {
        type: Number,
    },
    reviewedBy: {
        type: String,
        ref: 'User',
    },
});
// Índices para optimizar consultas
UserReportSchema.index({ reporterId: 1, createdAt: -1 });
UserReportSchema.index({ reportedUserId: 1, createdAt: -1 });
UserReportSchema.index({ status: 1, createdAt: -1 });
UserReportSchema.index({ commentId: 1 });
UserReportSchema.index({ noteId: 1 });
// Evitar reportes duplicados del mismo usuario para el mismo contenido
UserReportSchema.index({ reporterId: 1, reportedUserId: 1, commentId: 1 }, { unique: true, partialFilterExpression: { commentId: { $exists: true } } });
UserReportSchema.index({ reporterId: 1, reportedUserId: 1, noteId: 1 }, { unique: true, partialFilterExpression: { noteId: { $exists: true } } });
const UserReport = (0, mongoose_1.model)('UserReport', UserReportSchema);
exports.default = UserReport;
//# sourceMappingURL=user-report.js.map