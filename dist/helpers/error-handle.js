"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleError = (res, error, errorRAW) => {
    console.log({ errorRAW });
    res.status(500).json({
        error
    });
};
exports.default = handleError;
//# sourceMappingURL=error-handle.js.map