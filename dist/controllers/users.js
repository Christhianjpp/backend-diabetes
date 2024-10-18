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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUser = exports.getUsers = void 0;
const user_1 = __importDefault(require("../models/user"));
const bcrypt_handle_1 = require("../helpers/bcrypt-handle");
const error_handle_1 = __importDefault(require("../helpers/error-handle"));
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { desde = 0, limit = 5 } = req.params;
        const query = { state: true };
        const [total, users] = yield Promise.all([
            user_1.default.countDocuments(query),
            user_1.default.find(query)
                .skip(Number(desde))
                .limit(Number(limit))
        ]);
        res.status(200).json({ total, users });
    }
    catch (error) {
        (0, error_handle_1.default)(res, 'ERROR_GET_USERS', error);
    }
});
exports.getUsers = getUsers;
const getUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_1.default.findById(id);
        if (!user) {
            return (0, error_handle_1.default)(res, `User: ${id}, does not exist`);
        }
        res.status(200).json({ user });
    }
    catch (error) {
        (0, error_handle_1.default)(res, 'ERROR_GET_USER', error);
    }
});
exports.getUser = getUser;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, userName } = req.body;
        const user = new user_1.default({
            name: name.toLowerCase(),
            email: email.toLowerCase(),
            password,
            userName,
        });
        user.password = (0, bcrypt_handle_1.encrypt)(password);
        yield user.save();
        console.log(user);
        res.json({
            msg: 'Post API- controlador',
            user
        });
    }
    catch (error) {
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const _a = req.body, { password, google, email } = _a, resto = __rest(_a, ["password", "google", "email"]);
        const user = yield user_1.default.findByIdAndUpdate(id, resto, { new: true });
        res.status(200).json({ user });
    }
    catch (error) {
        (0, error_handle_1.default)(res, 'ERROR_PUT_USER', error);
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield user_1.default.findByIdAndUpdate(id, { state: false }, { new: true });
        res.status(200).json({ msg: 'Deleted user' });
    }
    catch (error) {
        (0, error_handle_1.default)(res, 'ERROR_DELETE_USER', error);
    }
});
exports.deleteUser = deleteUser;
//# sourceMappingURL=users.js.map