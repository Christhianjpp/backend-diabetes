"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const validateFields = (req, res, next) => {
    console.log("validateFields");
    const errors = (0, express_validator_1.validationResult)(req);
    console.log(errors);
    if (!errors.isEmpty()) {
        return res.status(400).json(errors);
    }
    next();
};
exports.default = validateFields;
//# sourceMappingURL=validate-fields.js.map