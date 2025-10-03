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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockedUsersService = exports.unblockUserService = exports.blockUserService = exports.isUserBlocked = exports.getBlockedUserIds = void 0;
const user_1 = __importDefault(require("../models/user"));
const blocked_user_1 = __importDefault(require("../models/blocked-user"));
const note_like_1 = __importDefault(require("../models/note-like"));
/**
 * Obtener lista de IDs de usuarios bloqueados por un usuario
 * Consulta directamente la colección BlockedUser para obtener los IDs
 */
const getBlockedUserIds = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blockedUsers = yield blocked_user_1.default.find({ blockerId: userId }).select('blockedUserId');
        const blockedIds = blockedUsers.map(block => block.blockedUserId);
        console.log(`🔍 Usuario ${userId} ha bloqueado a:`, blockedIds);
        return blockedIds;
    }
    catch (error) {
        console.error('Error obteniendo usuarios bloqueados:', error);
        return [];
    }
});
exports.getBlockedUserIds = getBlockedUserIds;
/**
 * Verificar si un usuario está bloqueado
 */
const isUserBlocked = (blockerId, blockedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const block = yield blocked_user_1.default.findOne({ blockerId, blockedUserId });
        return !!block;
    }
    catch (error) {
        console.error('Error verificando bloqueo:', error);
        return false;
    }
});
exports.isUserBlocked = isUserBlocked;
/**
 * Validar que los usuarios existan y sean válidos para el bloqueo
 */
const validateBlockUsers = (blockerId, blockedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Verificar auto-bloqueo
    if (blockerId === blockedUserId) {
        throw new Error("No puedes bloquearte a ti mismo");
    }
    // Verificar usuario a bloquear
    const blockedUser = yield user_1.default.findById(blockedUserId);
    if (!blockedUser) {
        throw new Error("El usuario a bloquear no existe");
    }
    if (!blockedUser.name) {
        throw new Error("El usuario a bloquear no tiene nombre válido");
    }
    // Verificar usuario bloqueador
    const blockerUser = yield user_1.default.findById(blockerId);
    if (!blockerUser) {
        throw new Error("Usuario bloqueador no encontrado");
    }
    // Verificar si ya está bloqueado
    const existingBlock = yield blocked_user_1.default.findOne({ blockerId, blockedUserId });
    if (existingBlock) {
        throw new Error("Este usuario ya está bloqueado");
    }
    return { blockedUser, blockerUser };
});
/**
 * Limpiar relaciones entre usuarios (usuarios guardados)
 */
const cleanUserRelations = (blockerId, blockedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        user_1.default.findByIdAndUpdate(blockerId, { $pull: { usersSaved: blockedUserId } }),
        user_1.default.findByIdAndUpdate(blockedUserId, { $pull: { usersSaved: blockerId } })
    ]);
});
/**
 * Limpiar interacciones (likes, comentarios, etc.)
 */
const cleanInteractions = (blockerId, blockedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    // Limpiar likes mutuos
    yield note_like_1.default.deleteMany({
        $or: [
            { userId: blockerId, likedUserId: blockedUserId },
            { userId: blockedUserId, likedUserId: blockerId }
        ]
    });
    // Aquí se pueden agregar más limpiezas según sea necesario
});
/**
 * Actualizar el modelo User con información del bloqueo
 */
const updateUserBlockInfo = (blockerId, blockedUserId, blockerName) => __awaiter(void 0, void 0, void 0, function* () {
    yield Promise.all([
        // Incrementar contador de violaciones
        user_1.default.findByIdAndUpdate(blockedUserId, { $inc: { violations: 1 } }),
        // Crear notificación
        user_1.default.findByIdAndUpdate(blockedUserId, {
            $push: {
                notifications: {
                    typeNotification: 'alert',
                    message: `El usuario ${blockerName} te ha bloqueado`,
                    read: false,
                }
            }
        })
    ]);
});
/**
 * Bloquear un usuario (función principal)
 */
const blockUserService = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { blockerId, blockedUserId, reason } = data;
    try {
        // 1. Validar usuarios
        const { blockedUser, blockerUser } = yield validateBlockUsers(blockerId, blockedUserId);
        // 2. Crear el registro de bloqueo
        const block = new blocked_user_1.default({
            blockerId,
            blockedUserId,
            blockedUserName: blockedUser.name,
            blockedUserImg: blockedUser.img,
            reason,
            createdAt: Date.now(),
        });
        yield block.save();
        console.log(`💾 Registro de bloqueo guardado:`, block.toJSON());
        // 3. Ejecutar operaciones de limpieza en paralelo
        yield Promise.all([
            cleanUserRelations(blockerId, blockedUserId),
            cleanInteractions(blockerId, blockedUserId),
            updateUserBlockInfo(blockerId, blockedUserId, blockerUser.name)
        ]);
        console.log(`✅ Usuario ${blockedUserId} bloqueado por ${blockerId}`);
        // 4. Verificar que el bloqueo se guardó correctamente
        const verificationBlock = yield blocked_user_1.default.findOne({ blockerId, blockedUserId });
        console.log(`🔍 Verificación de bloqueo:`, verificationBlock ? 'EXITOSO' : 'FALLO');
        return {
            success: true,
            block: block.toJSON()
        };
    }
    catch (error) {
        console.error("❌ Error en bloqueo de usuario:", error);
        return {
            success: false,
            error: error.message || "Error al bloquear usuario"
        };
    }
});
exports.blockUserService = blockUserService;
/**
 * Desbloquear un usuario
 */
const unblockUserService = (blockerId, blockedUserId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Eliminar el registro de bloqueo
        const block = yield blocked_user_1.default.findOneAndDelete({ blockerId, blockedUserId });
        if (!block) {
            throw new Error("Este usuario no está bloqueado");
        }
        // Decrementar contador de violaciones
        yield user_1.default.findByIdAndUpdate(blockedUserId, { $inc: { violations: -1 } });
        console.log(`✅ Usuario ${blockedUserId} desbloqueado por ${blockerId}`);
        return {
            success: true
        };
    }
    catch (error) {
        console.error("❌ Error en desbloqueo de usuario:", error);
        return {
            success: false,
            error: error.message || "Error al desbloquear usuario"
        };
    }
});
exports.unblockUserService = unblockUserService;
/**
 * Obtener lista de usuarios bloqueados con paginación
 */
const getBlockedUsersService = (blockerId_1, ...args_1) => __awaiter(void 0, [blockerId_1, ...args_1], void 0, function* (blockerId, desde = 0, limit = 20) {
    try {
        const [total, blockedUsers] = yield Promise.all([
            blocked_user_1.default.countDocuments({ blockerId }),
            blocked_user_1.default.find({ blockerId })
                .sort({ createdAt: -1 })
                .skip(desde)
                .limit(limit)
        ]);
        return {
            success: true,
            total,
            blockedUsers
        };
    }
    catch (error) {
        console.error("❌ Error obteniendo usuarios bloqueados:", error);
        return {
            success: false,
            error: error.message || "Error al obtener usuarios bloqueados"
        };
    }
});
exports.getBlockedUsersService = getBlockedUsersService;
//# sourceMappingURL=userBlocking.js.map