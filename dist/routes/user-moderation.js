"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const user_moderation_1 = require("../controllers/user-moderation");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
// Reportar usuario
router.post("/report", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("reportedUserId", "El ID del usuario reportado es obligatorio").not().isEmpty(),
    (0, express_validator_1.check)("reportedUserId", "El ID del usuario reportado no es válido").isMongoId(),
    (0, express_validator_1.check)("reason", "La razón del reporte es obligatoria").not().isEmpty(),
    (0, express_validator_1.check)("reason", "La razón del reporte no es válida").isIn([
        'spam',
        'harassment',
        'inappropriate_content',
        'hate_speech',
        'fake_information',
        'other'
    ]),
    (0, express_validator_1.check)("commentId", "El ID del comentario debe ser válido").optional().isMongoId(),
    (0, express_validator_1.check)("noteId", "El ID de la nota debe ser válido").optional().isMongoId(),
    (0, express_validator_1.check)("description", "La descripción no puede exceder 500 caracteres").optional().isLength({ max: 500 }),
    middlewares_1.validateFields,
], user_moderation_1.reportUser);
// Bloquear usuario
router.post("/block", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("blockedUserId", "El ID del usuario a bloquear es obligatorio").not().isEmpty(),
    (0, express_validator_1.check)("blockedUserId", "El ID del usuario a bloquear no es válido").isMongoId(),
    (0, express_validator_1.check)("reason", "La razón del bloqueo no puede exceder 200 caracteres").optional().isLength({ max: 200 }),
    middlewares_1.validateFields,
], user_moderation_1.blockUser);
// Desbloquear usuario
router.delete("/block/:blockedUserId", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("blockedUserId", "El ID del usuario a desbloquear no es válido").isMongoId(),
    middlewares_1.validateFields,
], user_moderation_1.unblockUser);
// Obtener usuarios bloqueados por el usuario actual
router.get("/blocked", [
    middlewares_1.validateJWT,
], user_moderation_1.getBlockedUsers);
// Obtener mis reportes
router.get("/reports", [
    middlewares_1.validateJWT,
], user_moderation_1.getMyReports);
// Verificar si un usuario está bloqueado
router.get("/is-blocked/:userId", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("userId", "El ID del usuario no es válido").isMongoId(),
    middlewares_1.validateFields,
], user_moderation_1.isUserBlockedController);
// Obtener reporte por ID (para administradores)
router.get("/report/:reportId", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("reportId", "El ID del reporte no es válido").isMongoId(),
    middlewares_1.validateFields,
], user_moderation_1.getReportById);
// Actualizar estado de reporte (para administradores)
router.patch("/report/:reportId/status", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("reportId", "El ID del reporte no es válido").isMongoId(),
    (0, express_validator_1.check)("status", "El estado es obligatorio").not().isEmpty(),
    (0, express_validator_1.check)("status", "El estado no es válido").isIn([
        'pending',
        'reviewed',
        'resolved',
        'dismissed'
    ]),
    middlewares_1.validateFields,
], user_moderation_1.updateReportStatus);
exports.default = router;
//# sourceMappingURL=user-moderation.js.map