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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_1 = __importDefault(require("../models/user"));
/**
 * Middleware para validar JWT y adjuntar el usuario a la solicitud
 */
const validateJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Obtener el header de autorización
        const authHeader = req.header("Authorization");
        // Verificar si existe el header de autorización
        if (!authHeader) {
            return res.status(401).json({
                ok: false,
                msg: "No hay token en la petición"
            });
        }
        // Extraer el token del formato "Bearer <token>"
        const token = authHeader.replace(/^Bearer\s+/, "");
        if (!token) {
            return res.status(401).json({
                ok: false,
                msg: "Formato de token inválido"
            });
        }
        // Verificar el token y extraer la información del usuario
        const secretKey = process.env.SECRETORPRIVATEKEY;
        if (!secretKey) {
            console.error("Error crítico: SECRETORPRIVATEKEY no está definido en las variables de entorno");
            return res.status(500).json({
                ok: false,
                msg: "Error de configuración del servidor"
            });
        }
        // Decodificar el token
        const { uid } = jsonwebtoken_1.default.verify(token, secretKey);
        // Buscar el usuario en la base de datos
        const user = yield user_1.default.findById(uid);
        // Verificar si el usuario existe
        if (!user) {
            return res.status(401).json({
                ok: false,
                msg: "Token no válido - usuario no existe"
            });
        }
        // Verificar si el usuario está activo
        if (!user.state) {
            return res.status(401).json({
                ok: false,
                msg: "Token no válido - usuario inactivo"
            });
        }
        // Adjuntar el usuario a la solicitud para usarlo en los controladores
        req.user = user;
        // Continuar con el siguiente middleware o controlador
        next();
    }
    catch (error) {
        console.log("Error en validación de token:", error);
        // Personalizar mensaje según el tipo de error
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                ok: false,
                msg: "Token inválido"
            });
        }
        else if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                ok: false,
                msg: "Token expirado"
            });
        }
        return res.status(401).json({
            ok: false,
            msg: "Error de autenticación"
        });
    }
});
exports.default = validateJWT;
//# sourceMappingURL=validate-jwt.js.map