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
exports.generateVerificationCode = void 0;
const verification_code_1 = __importDefault(require("../models/verification-code"));
// Generar un nuevo código de verificación
const generateVerificationCode = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // Generar un código aleatorio de 4 dígitos
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
    // Calcular la fecha y hora de expiración (2 minutos desde ahora)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutos
    // Crear un nuevo documento de código de verificación
    const verificationCode = new verification_code_1.default({
        userId,
        code,
        expiresAt,
    });
    // Guardar el nuevo código de verificación en la base de datos
    yield verificationCode.save();
    // Devolver el código de verificación generado
    return code;
});
exports.generateVerificationCode = generateVerificationCode;
//# sourceMappingURL=code-verification.js.map