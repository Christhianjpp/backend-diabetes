"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdminRole = void 0;
const isAdminRole = (req, res, next) => {
    if (!req.user) {
        return res.status(500).json({
            msg: 'Need_token'
        });
    }
    const { rol, name } = req.user;
    if (rol !== 'ADMIN_ROLE') {
        return res.status(401).json({
            msg: `${name} is not administrator`
        });
    }
    next();
};
exports.isAdminRole = isAdminRole;
//# sourceMappingURL=validate-roles.js.map