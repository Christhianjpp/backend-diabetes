"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const generatJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        const payload = { uid };
        (0, jsonwebtoken_1.sign)(payload, `${process.env.SECRETORPRIVATEKEY}`, (err, token) => {
            if (err) {
                console.log(err);
                reject('canno generate a token');
            }
            else {
                resolve(token);
            }
        });
    });
};
exports.default = generatJWT;
// {
//     expiresIn: '4h'
// },
//# sourceMappingURL=generate-jwt.js.map