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
exports.newForgotPassword = exports.verifyCode = exports.forgotPassword = exports.changePassword = exports.googleSignIn = exports.login = exports.validarTokenUser = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_handle_1 = require("../helpers/bcrypt-handle");
const generate_jwt_1 = __importDefault(require("../helpers/generate-jwt"));
const google_verify_1 = __importDefault(require("../helpers/google-verify"));
const userCreateName_1 = require("../helpers/userCreateName");
const jsonwebtoken_1 = require("jsonwebtoken");
const code_verification_1 = require("../helpers/code-verification");
const send_email_1 = require("../helpers/send-email");
const verification_code_1 = __importDefault(require("../models/verification-code"));
const error_handle_1 = __importStar(require("../helpers/error-handle"));
const validarTokenUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const token = yield (0, generate_jwt_1.default)(user._id);
        res.status(200).json({
            user,
            token,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Error al validar token", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER,
            data: error
        });
    }
});
exports.validarTokenUser = validarTokenUser;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const regex = new RegExp(email, "i");
    try {
        const user = yield user_1.default.findOne({ email: regex });
        if (!user) {
            return (0, error_handle_1.default)(res, "Email o contraseña incorrecta", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        if (!user.state) {
            return (0, error_handle_1.default)(res, "Email o contraseña incorrecta", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        const validPassword = (0, bcrypt_handle_1.verfied)(password, user.password);
        if (!validPassword) {
            return (0, error_handle_1.default)(res, "Email o contraseña incorrecta", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        res.json({
            user,
            token,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Hable con el administrador", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER,
            data: error
        });
    }
});
exports.login = login;
const googleSignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { idToken } = req.body;
    try {
        const { name, img, email } = yield (0, google_verify_1.default)(idToken);
        let user = yield user_1.default.findOne({ email });
        if (!user) {
            // creo usuario
            const data = {
                userName: (0, userCreateName_1.userName)(name),
                name: name.slice(0, 20),
                email,
                password: ":P",
                img,
                google: true,
            };
            user = new user_1.default(data);
            yield user.save();
        }
        // Verificar estado del usuario
        if (!user.state) {
            return (0, error_handle_1.default)(res, "Usuario bloqueado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        res.json({
            user,
            token,
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Error en token de Google", {
            statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST,
            data: error
        });
    }
});
exports.googleSignIn = googleSignIn;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Cambio de contraseña');
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;
        console.log({ currentPassword, newPassword });
        if (!user) {
            return (0, error_handle_1.default)(res, "Usuario no encontrado", {
                statusCode: error_handle_1.HttpStatusCode.NOT_FOUND
            });
        }
        const validPassword = (0, bcrypt_handle_1.verfied)(currentPassword, user.password);
        console.log({ validPassword });
        if (!validPassword) {
            return (0, error_handle_1.default)(res, "Contraseña actual incorrecta", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        user.password = (0, bcrypt_handle_1.encrypt)(newPassword);
        yield user.save();
        res.status(200).json({ msg: "Contraseña actualizada correctamente" });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Error al cambiar contraseña", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER,
            data: error
        });
    }
});
exports.changePassword = changePassword;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // const user = await User.findOne<IUser>({ email })
        const user = yield user_1.default.findOne({
            email: { $regex: new RegExp("^" + email + "$", "i") },
        });
        if (!user || !(user === null || user === void 0 ? void 0 : user.state)) {
            return (0, error_handle_1.default)(res, "Lo sentimos, no se ha encontrado ninguna coincidencia. Por favor, intente nuevamente.", {
                statusCode: error_handle_1.HttpStatusCode.NOT_FOUND
            });
        }
        const token = (0, jsonwebtoken_1.sign)({ uid: user._id }, `${process.env.SECRETORPRIVATEKEYFORGOT}`, {
            expiresIn: "3m",
        });
        console.log('token sendEmailPasswordForgot', token);
        // Genera un codigo numerico de 8 sifras, expira en 5 minutos y lo almacena en la base de datos
        const verificationCode = yield (0, code_verification_1.generateVerificationCode)(user._id.toString());
        // Envia un correo electronico al usuario con el co digo
        (0, send_email_1.sendEmailPasswordForgot)({ verificationCode, email: user.email });
        // Devuelto el token
        res.status(200).json(token);
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Revise su correo electrónico para obtener un enlace para restablecer su contraseña", {
            data: error
        });
    }
});
exports.forgotPassword = forgotPassword;
const verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    const user = req.user;
    try {
        // octengo el codigo de verificación de la base de datos
        const resp = yield verification_code_1.default.findOne({ userId: user._id }).sort({ createdAt: -1 }); // Ordenar por `createdAt` en orden descendente
        // Verifico si el codigo existe
        if (!resp) {
            return (0, error_handle_1.default)(res, "Código expirado", {
                statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
            });
        }
        // Verifico si el codigo es el mismo que envio el usuario
        if (resp.code === code) {
            res.status(200).json({ msg: "Code OK" });
            return;
        }
        return (0, error_handle_1.default)(res, "Código inválido", {
            statusCode: error_handle_1.HttpStatusCode.UNAUTHORIZED
        });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Error al verificar código", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER,
            data: error
        });
    }
});
exports.verifyCode = verifyCode;
const newForgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { password } = req.body;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Guardo la nueva contraseña
        const user = yield user_1.default.findByIdAndUpdate(id, {
            password: (0, bcrypt_handle_1.encrypt)(password),
        });
        if (!user) {
            return (0, error_handle_1.default)(res, "Error al actualizar contraseña", {
                statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST
            });
        }
        res.status(200).json({ msg: 'Contraseña actualizada correctamente' });
    }
    catch (error) {
        (0, error_handle_1.default)(res, "Error al crear nueva contraseña", {
            statusCode: error_handle_1.HttpStatusCode.INTERNAL_SERVER,
            data: error
        });
    }
});
exports.newForgotPassword = newForgotPassword;
//# sourceMappingURL=auth.js.map