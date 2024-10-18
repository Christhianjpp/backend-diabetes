"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verfied = exports.encrypt = void 0;
const bcryptjs_1 = require("bcryptjs");
const encrypt = (password) => {
    const salt = (0, bcryptjs_1.genSaltSync)(10);
    return (0, bcryptjs_1.hashSync)(password, salt);
};
exports.encrypt = encrypt;
const verfied = (password, dbPassword) => {
    return (0, bcryptjs_1.compareSync)(password, dbPassword);
};
exports.verfied = verfied;
//# sourceMappingURL=bcrypt-handle.js.map