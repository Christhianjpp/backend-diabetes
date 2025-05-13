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
exports.userNameExists = exports.coleccionesPermitidas = exports.userExists = exports.emailExists = void 0;
const user_1 = __importDefault(require("../models/user"));
// Check User
const userNameExists = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (userName = "") {
    const regex = new RegExp(userName, "i");
    const userNameExists = yield user_1.default.findOne({ userName: regex });
    if (userNameExists) {
        throw new Error(`El usuario: ${userName} ya existe`);
    }
});
exports.userNameExists = userNameExists;
const emailExists = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (email = "") {
    console.log(email);
    const regex = new RegExp(email, "i");
    const existsEmail = yield user_1.default.findOne({ email: regex });
    if (existsEmail) {
        throw new Error(`El correo: ${email} ya existe`);
    }
});
exports.emailExists = emailExists;
const userExists = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (id = "") {
    const existsUser = yield user_1.default.findById(id);
    if (!existsUser) {
        throw new Error(`the User: ${id} does no exist`);
    }
});
exports.userExists = userExists;
// Validar colecciones permitidas
const coleccionesPermitidas = (coleccion = "", colecciones = [""]) => {
    const incluida = colecciones.includes(coleccion);
    if (!incluida) {
        throw new Error(`La colección ${coleccion} no es permitida - ${colecciones}`);
    }
    return true;
};
exports.coleccionesPermitidas = coleccionesPermitidas;
//# sourceMappingURL=db-validators.js.map