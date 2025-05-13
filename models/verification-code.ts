import { Schema, model } from "mongoose";
import { ICode } from "../interfaces/auth";

// Definir el schema de código de verificación
const VerificationCodeSchema = new Schema<ICode>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Agregar un índice en el campo 'expiresAt' para la expiración automática
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Crear el modelo de código de verificación
export default model("VerificationCode", VerificationCodeSchema);
