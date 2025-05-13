import VerificationCode from "../models/verification-code";

// Generar un nuevo código de verificación
export const generateVerificationCode = async (userId: string) => {
  // Generar un código aleatorio de 4 dígitos
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos

  // Calcular la fecha y hora de expiración (2 minutos desde ahora)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutos

  // Crear un nuevo documento de código de verificación
  const verificationCode = new VerificationCode({
    userId,
    code,
    expiresAt,
  });

  // Guardar el nuevo código de verificación en la base de datos
  await verificationCode.save();

  // Devolver el código de verificación generado
  return code;
};
