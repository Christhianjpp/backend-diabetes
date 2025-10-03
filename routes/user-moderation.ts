import { Router } from "express";
import { check } from "express-validator";

import {
  reportUser,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getMyReports,
  isUserBlockedController,
  getReportById,
  updateReportStatus,
} from "../controllers/user-moderation";
import { validateFields, validateJWT } from "../middlewares";

const router = Router();

// Reportar usuario
router.post(
  "/report",
  [
    validateJWT,
    check("reportedUserId", "El ID del usuario reportado es obligatorio").not().isEmpty(),
    check("reportedUserId", "El ID del usuario reportado no es válido").isMongoId(),
    check("reason", "La razón del reporte es obligatoria").not().isEmpty(),
    check("reason", "La razón del reporte no es válida").isIn([
      'spam',
      'harassment', 
      'inappropriate_content',
      'hate_speech',
      'fake_information',
      'other'
    ]),
    check("commentId", "El ID del comentario debe ser válido").optional().isMongoId(),
    check("noteId", "El ID de la nota debe ser válido").optional().isMongoId(),
    check("description", "La descripción no puede exceder 500 caracteres").optional().isLength({ max: 500 }),
    validateFields,
  ],
  reportUser
);

// Bloquear usuario
router.post(
  "/block",
  [
    validateJWT,
    check("blockedUserId", "El ID del usuario a bloquear es obligatorio").not().isEmpty(),
    check("blockedUserId", "El ID del usuario a bloquear no es válido").isMongoId(),
    check("reason", "La razón del bloqueo no puede exceder 200 caracteres").optional().isLength({ max: 200 }),
    validateFields,
  ],
  blockUser
);

// Desbloquear usuario
router.delete(
  "/block/:blockedUserId",
  [
    validateJWT,
    check("blockedUserId", "El ID del usuario a desbloquear no es válido").isMongoId(),
    validateFields,
  ],
  unblockUser
);

// Obtener usuarios bloqueados por el usuario actual
router.get(
  "/blocked",
  [
    validateJWT,
  ],
  getBlockedUsers
);

// Obtener mis reportes
router.get(
  "/reports",
  [
    validateJWT,
  ],
  getMyReports
);

// Verificar si un usuario está bloqueado
router.get(
  "/is-blocked/:userId",
  [
    validateJWT,
    check("userId", "El ID del usuario no es válido").isMongoId(),
    validateFields,
  ],
  isUserBlockedController
);

// Obtener reporte por ID (para administradores)
router.get(
  "/report/:reportId",
  [
    validateJWT,
    check("reportId", "El ID del reporte no es válido").isMongoId(),
    validateFields,
  ],
  getReportById
);

// Actualizar estado de reporte (para administradores)
router.patch(
  "/report/:reportId/status",
  [
    validateJWT,
    check("reportId", "El ID del reporte no es válido").isMongoId(),
    check("status", "El estado es obligatorio").not().isEmpty(),
    check("status", "El estado no es válido").isIn([
      'pending',
      'reviewed',
      'resolved',
      'dismissed'
    ]),
    validateFields,
  ],
  updateReportStatus
);

export default router;
