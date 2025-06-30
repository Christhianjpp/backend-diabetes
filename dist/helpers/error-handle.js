"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpStatusCode = void 0;
var HttpStatusCode;
(function (HttpStatusCode) {
    HttpStatusCode[HttpStatusCode["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatusCode[HttpStatusCode["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatusCode[HttpStatusCode["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatusCode[HttpStatusCode["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatusCode[HttpStatusCode["INTERNAL_SERVER"] = 500] = "INTERNAL_SERVER";
})(HttpStatusCode || (exports.HttpStatusCode = HttpStatusCode = {}));
/**
 * Maneja errores HTTP y envía respuestas apropiadas
 * @param res - Express Response object
 * @param message - Mensaje de error para el cliente
 * @param options - Opciones adicionales para personalizar la respuesta
 */
const handleError = (res, message, options) => {
    const statusCode = (options === null || options === void 0 ? void 0 : options.statusCode) || HttpStatusCode.INTERNAL_SERVER;
    const logError = (options === null || options === void 0 ? void 0 : options.logError) !== false;
    const errorResponse = {
        message,
        code: statusCode,
    };
    if (options === null || options === void 0 ? void 0 : options.data) {
        errorResponse.data = options.data;
    }
    if ((options === null || options === void 0 ? void 0 : options.includeStack) && options.data instanceof Error) {
        errorResponse.stack = options.data.stack;
    }
    if (logError) {
        console.error(`[ERROR] ${message}`, (options === null || options === void 0 ? void 0 : options.data) || '');
    }
    return res.status(statusCode).json(errorResponse);
};
exports.default = handleError;
//# sourceMappingURL=error-handle.js.map