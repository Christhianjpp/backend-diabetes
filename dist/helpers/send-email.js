"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailDeleteAccount = exports.sendEmailPasswordForgot = void 0;
const nodemailer_1 = require("./nodemailer");
const sendEmail = ({ email, subject, body, }) => {
    nodemailer_1.transporter.sendMail({
        from: "Equipo de Soporte de Proyecto <soporte@proyecto.com>",
        to: email,
        subject,
        html: `
    <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
        <header style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #007bff;">${subject}</h1>
        </header>
        <main>
          ${body}
        </main>
        <footer style="margin-top: 20px; text-align: center; font-size: 12px; color: #777;">
          <p>Este correo no está monitorizado. Si necesitas asistencia, visita nuestra <a href="https://proyecto.com/soporte" style="color: #007bff;">página de soporte</a>.</p>
          <p>&copy; ${new Date().getFullYear()} Proyecto. Todos los derechos reservados.</p>
        </footer>
      </div>
    </body>
    `,
    });
};
const sendEmailPasswordForgot = ({ verificationCode, email }) => {
    sendEmail({
        email,
        subject: "Recuperación de Contraseña en Proyecto",
        body: `
      <p>Hemos recibido una solicitud para recuperar la contraseña de tu cuenta. Por favor, utiliza el siguiente código de verificación para completar el proceso:</p>
      <div style="text-align: center; margin: 20px 0;">
        <h2 style="font-size: 24px; color: #007bff; margin: 0;">${verificationCode}</h2>
      </div>
      <p>Este código de verificación caducará en 3 minutos. Si no has solicitado esta acción, ignora este mensaje.</p>
      <p>Una vez que introduzcas el código en la aplicación, podrás configurar una nueva contraseña.</p>
    `,
    });
};
exports.sendEmailPasswordForgot = sendEmailPasswordForgot;
const sendEmailDeleteAccount = ({ verificationCode, email }) => {
    sendEmail({
        email,
        subject: "Verificación de Usuario en Proyecto",
        body: `
      <p>Hemos recibido una solicitud para verificar tu cuenta. Por favor, utiliza el siguiente código de verificación para completar el proceso:</p>
      <div style="text-align: center; margin: 20px 0;">
        <h2 style="font-size: 24px; color: #007bff; margin: 0;">${verificationCode}</h2>
      </div>
      <p>Este código de verificación caducará en 2 minutos. Si no has solicitado esta acción, ignora este mensaje.</p>
    `,
    });
};
exports.sendEmailDeleteAccount = sendEmailDeleteAccount;
//# sourceMappingURL=send-email.js.map