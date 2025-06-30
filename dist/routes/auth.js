"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_1 = require("../controllers/auth");
const validate_fields_1 = __importDefault(require("../middlewares/validate-fields"));
const middlewares_1 = require("../middlewares");
const validate_jwt_forgot_1 = __importDefault(require("../middlewares/validate-jwt-forgot"));
const router = (0, express_1.Router)();
router.get("/check-status", [middlewares_1.validateJWT], validate_fields_1.default, auth_1.validarTokenUser);
router.post("/login", [
    (0, express_validator_1.check)("email", "Email is required").not().isEmpty(),
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password is required").not().isEmpty(),
    (0, express_validator_1.check)("password", "La contraseña debe tener entre 6 y 20 caracteres").isLength({ min: 6, max: 20 }),
    validate_fields_1.default,
], auth_1.login);
router.post("/google", [(0, express_validator_1.check)("id_token", "id_token is requerired").not().isEmpty(), validate_fields_1.default], auth_1.googleSignIn);
router.post("/change-password", [
    middlewares_1.validateJWT,
    (0, express_validator_1.check)("currentPassword", "Current password is required").not().isEmpty(),
    (0, express_validator_1.check)("newPassword", "New password is required").not().isEmpty(),
    validate_fields_1.default,
], auth_1.changePassword);
router.post("/forgot-password", [
    (0, express_validator_1.check)("email", "Email is required").not().isEmpty(),
    validate_fields_1.default,
    (0, express_validator_1.check)("email", "Email is invalid").isEmail(),
    validate_fields_1.default,
], auth_1.forgotPassword);
router.post("/verify-reset-code", [
    validate_jwt_forgot_1.default,
    (0, express_validator_1.check)("code", "code is required").not().isEmpty(),
    (0, express_validator_1.check)("code", "The code must have more than 8 letters").isLength({
        min: 4,
        max: 4,
    }),
    (0, express_validator_1.check)("code", "New code is required").not().isEmpty(),
    (0, express_validator_1.check)("code", "The new code must have more than 8 letters").isLength({
        min: 4,
        max: 4,
    }),
    validate_fields_1.default,
], auth_1.verifyCode);
router.put("/new-password-forgot", [
    validate_jwt_forgot_1.default,
    (0, express_validator_1.check)("password", "Password is required").not().isEmpty(),
    (0, express_validator_1.check)("password", "The password must have more than 6 letters").isLength({
        min: 6,
        max: 15,
    }),
    validate_fields_1.default,
], auth_1.newForgotPassword);
exports.default = router;
//# sourceMappingURL=auth.js.map