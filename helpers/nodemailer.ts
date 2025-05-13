import nodemailer from "nodemailer";
import dotenv from 'dotenv';
dotenv.config();
// async..await is not allowed in global scope, must use a wrapper

// create reusable transporter object using the default SMTP transport
export const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || "christhianjpp@gmail.com", 
        pass: process.env.PASSWORD_NODEMAILER,
    },
})

transporter.verify().then(() => {
    console.log('Ready for send emails')
}).catch(error => {
    console.error('Email configuration error:', error);
})