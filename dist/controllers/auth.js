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
exports.newForgotPassword = exports.verifyCode = exports.forgotPassword = exports.googleSignIn = exports.login = exports.validarTokenUser = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_handle_1 = require("../helpers/bcrypt-handle");
const generate_jwt_1 = __importDefault(require("../helpers/generate-jwt"));
const google_verify_1 = __importDefault(require("../helpers/google-verify"));
const userCreateName_1 = require("../helpers/userCreateName");
const jsonwebtoken_1 = require("jsonwebtoken");
const code_verification_1 = require("../helpers/code-verification");
const send_email_1 = require("../helpers/send-email");
const verification_code_1 = __importDefault(require("../models/verification-code"));
const validarTokenUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("validarTokenUser");
    try {
        const user = req.user;
        const token = yield (0, generate_jwt_1.default)(user._id);
        res.status(200).json({
            user,
            token,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Error Token",
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
            return res.status(400).json({
                msg: "Email or password is incorrect",
            });
        }
        if (!user.state) {
            return res.status(400).json({
                msg: "Email or password is incorrect",
            });
        }
        const validPassword = (0, bcrypt_handle_1.verfied)(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                msg: "Email or password is incorrect",
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        res.json({
            user,
            token,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            msg: "Talk to the administrator",
        });
    }
});
exports.login = login;
const googleSignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("googleSignIn");
    const { id_token } = req.body;
    try {
        const { name, img, email } = yield (0, google_verify_1.default)(id_token);
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
            return res.status(401).json({
                msg: "User blocked",
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        res.json({
            user,
            token,
        });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            msg: "Error Token Google",
        });
    }
});
exports.googleSignIn = googleSignIn;
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // const user = await User.findOne<IUser>({ email })
        const user = yield user_1.default.findOne({
            email: { $regex: new RegExp("^" + email + "$", "i") },
        });
        if (!user || !(user === null || user === void 0 ? void 0 : user.state)) {
            return res.status(404).json({
                msg: "Lo sentimos, no se ha encontrado ninguna coincidencia. Por favor, intente nuevamente.",
            });
        }
        const token = (0, jsonwebtoken_1.sign)({ uid: user._id }, `${process.env.SECRETORPRIVATEKEYFORGOT}`, {
            expiresIn: "3m",
        });
        // Genera un codigo numerico de 8 sifras, expira en 5 minutos y lo almacena en la base de datos
        const verificationCode = yield (0, code_verification_1.generateVerificationCode)(user._id.toString());
        // Envia un correo electronico al usuario con el co digo
        (0, send_email_1.sendEmailPasswordForgot)({ verificationCode, email: user.email });
        // Devuelto el token
        res.status(200).json(token);
    }
    catch (error) {
        console.log(error);
        return res.json({
            msg: "Revise su correo electrónico para obtener un enlace para restablecer su contraseña",
        });
    }
});
exports.forgotPassword = forgotPassword;
const verifyCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("verifyCode");
    const { code } = req.body;
    const user = req.user;
    // octengo el codigo de verificación de la base de datos
    const resp = yield verification_code_1.default.findOne({ userId: user._id }).sort({ createdAt: -1 }); // Ordenar por `createdAt` en orden descendente
    console.log("resp", resp);
    // Verifico si el codigo existe
    if (!resp) {
        res.status(401).json({ msg: "Expired Code" });
        return;
    }
    console.log(resp.code, code);
    // Verifico si el codigo es el mismo que envio el usuario
    if (resp.code === code) {
        res.status(200).json({ msg: "Code OK" });
        return;
    }
    res.status(401).json({ msg: "Invalid Code" });
});
exports.verifyCode = verifyCode;
const newForgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("first");
    const { password } = req.body;
    console.log({ password });
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        // Guardo la nueva contraseña
        const user = yield user_1.default.findByIdAndUpdate(id, {
            password: (0, bcrypt_handle_1.encrypt)(password),
        });
        if (!user) {
            res.status(400).json({ msg: "Error Update Password" });
            return;
        }
        // creo un nuevo token
        const token = yield (0, generate_jwt_1.default)(user.id);
        console.log(user);
        res.status(200).json({
            user,
            token,
        });
    }
    catch (error) {
        console.log(error);
        return res.json({ msg: "Error New Password" });
    }
});
exports.newForgotPassword = newForgotPassword;
//# sourceMappingURL=auth.js.map