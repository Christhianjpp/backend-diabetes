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
exports.googleSignIn = exports.login = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_handle_1 = require("../helpers/bcrypt-handle");
const generate_jwt_1 = __importDefault(require("../helpers/generate-jwt"));
const google_verify_1 = __importDefault(require("../helpers/google-verify"));
const userName_google_1 = require("../helpers/userName-google");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const regex = new RegExp(email, 'i');
    try {
        const user = yield user_1.default.findOne({ email: regex });
        if (!user) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            });
        }
        if (!user.state) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            });
        }
        const validPassword = (0, bcrypt_handle_1.verfied)(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        res.json({
            user,
            token
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            msg: 'Talk to the administrator'
        });
    }
});
exports.login = login;
const googleSignIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_token } = req.body;
    try {
        const { name, img, email } = yield (0, google_verify_1.default)(id_token);
        let user = yield user_1.default.findOne({ email });
        if (!user) {
            // creo usuario
            const data = {
                userName: (0, userName_google_1.userNameGoogle)(name),
                name: name.slice(0, 20),
                email,
                password: ':P',
                img,
                google: true,
            };
            user = new user_1.default(data);
            yield user.save();
        }
        // Verificar estado del usuario
        if (!user.state) {
            return res.status(401).json({
                msg: 'User blocked'
            });
        }
        const token = yield (0, generate_jwt_1.default)(user.id);
        console.log(user);
        res.json({
            user,
            token
        });
    }
    catch (error) {
        console.log(error);
        res.status(400).json({
            msg: 'Error Token Google'
        });
    }
});
exports.googleSignIn = googleSignIn;
//# sourceMappingURL=auth.js.map