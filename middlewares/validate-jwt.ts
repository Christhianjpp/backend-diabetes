import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user";

// Interfaz para el payload decodificado del JWT
interface IDecode {
  uid: string;
  iat: number;
  exp: number;
}

/**
 * Middleware para validar JWT y adjuntar el usuario a la solicitud
 */
const validateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener el header de autorización
    const authHeader = req.header("Authorization");
    
    // Verificar si existe el header de autorización
    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        msg: "No hay token en la petición"
      });
    }

    // Extraer el token del formato "Bearer <token>"
    const token = authHeader.replace(/^Bearer\s+/, "");

    if (!token) {
      return res.status(401).json({
        ok: false,
        msg: "Formato de token inválido"
      });
    }

    // Verificar el token y extraer la información del usuario
    const secretKey = process.env.SECRETORPRIVATEKEY;
    if (!secretKey) {
      console.error("Error crítico: SECRETORPRIVATEKEY no está definido en las variables de entorno");
      return res.status(500).json({
        ok: false,
        msg: "Error de configuración del servidor"
      });
    }

    // Decodificar el token
    const { uid } = jwt.verify(token, secretKey) as IDecode;

    // Buscar el usuario en la base de datos
    const user = await User.findById(uid);

    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({
        ok: false,
        msg: "Token no válido - usuario no existe"
      });
    }

    // Verificar si el usuario está activo
    if (!user.state) {
      return res.status(401).json({
        ok: false,
        msg: "Token no válido - usuario inactivo"
      });
    }

    // Adjuntar el usuario a la solicitud para usarlo en los controladores
    req.user = user;

    // Continuar con el siguiente middleware o controlador
    next();
  } catch (error) {
    console.log("Error en validación de token:", error);
    
    // Personalizar mensaje según el tipo de error
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        ok: false,
        msg: "Token inválido"
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        ok: false,
        msg: "Token expirado"
      });
    }
    
    return res.status(401).json({
      ok: false,
      msg: "Error de autenticación"
    });
  }
};

export default validateJWT;
