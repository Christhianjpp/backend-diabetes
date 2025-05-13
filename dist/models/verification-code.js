"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Definir el schema de código de verificación
const VerificationCodeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});
// Agregar un índice en el campo 'expiresAt' para la expiración automática
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Crear el modelo de código de verificación
exports.default = (0, mongoose_1.model)("VerificationCode", VerificationCodeSchema);
//# sourceMappingURL=verification-code.js.map