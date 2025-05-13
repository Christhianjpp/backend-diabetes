"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// async..await is not allowed in global scope, must use a wrapper
// create reusable transporter object using the default SMTP transport
exports.transporter = nodemailer_1.default.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || "christhianjpp@gmail.com",
        pass: process.env.PASSWORD_NODEMAILER,
    },
});
exports.transporter.verify().then(() => {
    console.log('Ready for send emails');
}).catch(error => {
    console.error('Email configuration error:', error);
});
//# sourceMappingURL=nodemailer.js.map