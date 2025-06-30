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
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const error_handle_1 = __importStar(require("../helpers/error-handle"));
const validateFields = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        // Extraer solo los mensajes de error
        const errorArray = errors.array();
        const errorMessages = errorArray.map(err => err.msg);
        // Usar el primer mensaje o combinarlos si hay múltiples
        const errorMessage = errorMessages.length === 1
            ? errorMessages[0]
            : errorMessages.join('. ');
        return (0, error_handle_1.default)(res, errorMessage, {
            statusCode: error_handle_1.HttpStatusCode.BAD_REQUEST,
            logError: true
        });
    }
    next();
};
exports.default = validateFields;
//# sourceMappingURL=validate-fields.js.map