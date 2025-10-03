"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatus = exports.getReportById = exports.isUserBlockedController = exports.getMyReports = exports.getBlockedUsers = exports.unblockUser = exports.blockUser = exports.reportUser = void 0;
const error_handle_1 = __importStar(require("../helpers/error-handle"));
const user_report_1 = __importDefault(require("../models/user-report"));
const user_1 = __importDefault(require("../models/user"));
const userBlocking_1 = require("../services/userBlocking");
// Reportar usuario
const reportUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reportedUserId, commentId, noteId, reason, description } = req.body;
        const reporterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        // Verificar que no se esté reportando a sí mismo
        if (reporterId === reportedUserId) {
            return (0, error_handle_1.default)(res, "No puedes reportarte a ti mismo", { statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST });
        }
        // Verificar que el usuario reportado existe
        const reportedUser = yield user_1.default.findById(reportedUserId);
        if (!reportedUser) {
            return (0, error_handle_1.default)(res, "El usuario reportado no existe", { statusCode: error_handle_1.HttpStatusCode.NOT_FOUND });
        }
        // Crear el reporte
        const report = new user_report_1.default({
            reporterId,
            reportedUserId,
            commentId,
            noteId,
            reason,
            description,
            status: 'pending',
            createdAt: Date.now(),
        });
        yield report.save();
        res.status(201).json({
            success: true,
            message: "Reporte enviado correctamente",
            report,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "ERROR_CREATE_REPORT", error);
    }
});
exports.reportUser = reportUser;
// Bloquear usuario
const blockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { blockedUserId, reason } = req.body;
        const blockerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        // Validación básica de autenticación
        if (!blockerId) {
            return (0, error_handle_1.default)(res, "Usuario no autenticado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        // Validación de datos de entrada
        if (!blockedUserId) {
            return (0, error_handle_1.default)(res, "blockedUserId es requerido", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        // Ejecutar servicio de bloqueo
        const result = yield (0, userBlocking_1.blockUserService)({
            blockerId,
            blockedUserId,
            reason
        });
        // Manejar resultado
        if (!result.success) {
            const statusCode = ((_b = result.error) === null || _b === void 0 ? void 0 : _b.includes("no existe"))
                ? error_handle_1.HttpStatusCode.NOT_FOUND
                : error_handle_1.HttpStatusCode.BAD_REQUEST;
            return (0, error_handle_1.default)(res, result.error || "Error al bloquear usuario", {
                statusCode
            });
        }
        res.status(201).json({
            success: true,
            message: "Usuario bloqueado correctamente",
            block: result.block,
        });
    }
    catch (error) {
        console.error("ERROR_BLOCK_USER:", error);
        (0, error_handle_1.default)(res, "Error al bloquear usuario", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER
        });
    }
});
exports.blockUser = blockUser;
// Desbloquear usuario
const unblockUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { blockedUserId } = req.params;
        const blockerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        // Validación de autenticación
        if (!blockerId) {
            return (0, error_handle_1.default)(res, "Usuario no autenticado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        // Ejecutar servicio de desbloqueo
        const result = yield (0, userBlocking_1.unblockUserService)(blockerId, blockedUserId);
        // Manejar resultado
        if (!result.success) {
            return (0, error_handle_1.default)(res, result.error || "Error al desbloquear usuario", {
                statusCode: error_handle_1.HttpStatusCode.NOT_FOUND
            });
        }
        res.status(200).json({
            success: true,
            message: "Usuario desbloqueado correctamente",
        });
    }
    catch (error) {
        console.error("ERROR_UNBLOCK_USER:", error);
        (0, error_handle_1.default)(res, "Error al desbloquear usuario", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER
        });
    }
});
exports.unblockUser = unblockUser;
// Obtener usuarios bloqueados por el usuario actual
const getBlockedUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const blockerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { desde = 0, limit = 20 } = req.query;
        // Validación de autenticación
        if (!blockerId) {
            return (0, error_handle_1.default)(res, "Usuario no autenticado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        // Ejecutar servicio de obtención de bloqueados
        const result = yield (0, userBlocking_1.getBlockedUsersService)(blockerId, Number(desde), Number(limit));
        // Manejar resultado
        if (!result.success) {
            return (0, error_handle_1.default)(res, result.error || "Error al obtener usuarios bloqueados", {
                statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER
            });
        }
        res.status(200).json({
            success: true,
            total: result.total,
            blockedUsers: result.blockedUsers,
        });
    }
    catch (error) {
        console.error("ERROR_GET_BLOCKED_USERS:", error);
        (0, error_handle_1.default)(res, "Error al obtener usuarios bloqueados", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER
        });
    }
});
exports.getBlockedUsers = getBlockedUsers;
// Obtener mis reportes
const getMyReports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const reporterId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const { desde = 0, limit = 20 } = req.query;
        const [total, reports] = yield Promise.all([
            user_report_1.default.countDocuments({ reporterId }),
            user_report_1.default.find({ reporterId })
                .populate('reportedUserId', 'name img')
                .sort({ createdAt: -1 })
                .skip(Number(desde))
                .limit(Number(limit)),
        ]);
        res.status(200).json({
            success: true,
            total,
            reports,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "ERROR_GET_MY_REPORTS", error);
    }
});
exports.getMyReports = getMyReports;
// Verificar si un usuario está bloqueado
const isUserBlockedController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { userId } = req.params;
        const blockerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        // Validación de autenticación
        if (!blockerId) {
            return (0, error_handle_1.default)(res, "Usuario no autenticado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        // Ejecutar servicio de verificación
        const blocked = yield (0, userBlocking_1.isUserBlocked)(blockerId, userId);
        res.status(200).json({
            success: true,
            isBlocked: blocked,
        });
    }
    catch (error) {
        console.error("ERROR_CHECK_BLOCKED_USER:", error);
        (0, error_handle_1.default)(res, "Error al verificar bloqueo", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER
        });
    }
});
exports.isUserBlockedController = isUserBlockedController;
// Obtener reporte por ID (para administradores)
const getReportById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reportId } = req.params;
        const report = yield user_report_1.default.findById(reportId)
            .populate('reporterId', 'name img')
            .populate('reportedUserId', 'name img');
        if (!report) {
            return (0, error_handle_1.default)(res, "Reporte no encontrado", { statusCode: error_handle_1.HttpStatusCode.NOT_FOUND });
        }
        res.status(200).json({
            success: true,
            report,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "ERROR_GET_REPORT", error);
    }
});
exports.getReportById = getReportById;
// Actualizar estado de reporte (para administradores)
const updateReportStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { reportId } = req.params;
        const { status } = req.body;
        const reviewerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.uid;
        const report = yield user_report_1.default.findByIdAndUpdate(reportId, {
            status,
            reviewedAt: Date.now(),
            reviewedBy: reviewerId,
        }, { new: true });
        if (!report) {
            return (0, error_handle_1.default)(res, "Reporte no encontrado", { statusCode: error_handle_1.HttpStatusCode.NOT_FOUND });
        }
        res.status(200).json({
            success: true,
            message: "Estado del reporte actualizado correctamente",
            report,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "ERROR_UPDATE_REPORT_STATUS", error);
    }
});
exports.updateReportStatus = updateReportStatus;
//# sourceMappingURL=user-moderation.js.map