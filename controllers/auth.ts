import { Request, Response } from "express";
import { IAuth, ICode } from "../interfaces/auth";
import User from "../models/user";
import { encrypt, verfied } from "../helpers/bcrypt-handle";
import generatJWT from "../helpers/generate-jwt";
import googleVerify from "../helpers/google-verify";
import { userName } from "../helpers/userCreateName";
import { sign } from "jsonwebtoken";
import { generateVerificationCode } from "../helpers/code-verification";
import { IUser } from "../interfaces/user";
import { sendEmailPasswordForgot } from "../helpers/send-email";
import VerificationCode from "../models/verification-code";
import handleError, { HttpStatusCode } from "../helpers/error-handle";

export const validarTokenUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    const token = await generatJWT(user!._id);
    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    handleError(res, "Error al validar token", {
      statusCode: HttpStatusCode.INTERNAL_SERVER,
      data: error
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password }: IAuth = req.body;
  const regex = new RegExp(email, "i");

  try {
    const user = await User.findOne({ email: regex });
    if (!user) {
      return handleError(res, "Email o contraseña incorrecta", {
        statusCode: HttpStatusCode.BAD_REQUEST
      });
    }
    if (!user.state) {
      return handleError(res, "Email o contraseña incorrecta", {
        statusCode: HttpStatusCode.BAD_REQUEST
      });
    }
    const validPassword = verfied(password, user.password);

    if (!validPassword) {
      return handleError(res, "Email o contraseña incorrecta", {
        statusCode: HttpStatusCode.BAD_REQUEST
      });
    }
    const token = await generatJWT(user.id);


    res.json({
      user,
      token,
    });
  } catch (error) {
    handleError(res, "Hable con el administrador", {
      statusCode: HttpStatusCode.INTERNAL_SERVER,
      data: error
    });
  }
};


export const googleSignIn = async (req: Request, res: Response) => {
  const { idToken } = req.body;
  try {
    const { name, img, email } = await googleVerify(idToken);

    let user = await User.findOne({ email });

    if (!user) {
      // creo usuario
      const data = {
        userName: userName(name),
        name: name.slice(0, 20),
        email,
        password: ":P",
        img,
        google: true,
      };
      user = new User(data);
      await user.save();
    }
    // Verificar estado del usuario
    if (!user.state) {
      return handleError(res, "Usuario bloqueado", {
        statusCode: HttpStatusCode.UNAUTHORIZED
      });
    }

    const token = await generatJWT(user.id);

    res.json({
      user,
      token,
    });
  } catch (error) {
    handleError(res, "Error en token de Google", { 
      statusCode: HttpStatusCode.BAD_REQUEST,
      data: error
    });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  console.log('Cambio de contraseña');
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
console.log({currentPassword, newPassword});

  if (!user) {
    return handleError(res, "Usuario no encontrado", {
      statusCode: HttpStatusCode.NOT_FOUND
    });
  }

  const validPassword = verfied(currentPassword, user.password);
  console.log({validPassword});
  if (!validPassword) {
    return handleError(res, "Contraseña actual incorrecta", {
      statusCode: HttpStatusCode.BAD_REQUEST
    });
  }

  user.password = encrypt(newPassword);
  await user.save();

  res.status(200).json({ msg: "Contraseña actualizada correctamente" });
  } catch (error) {
    handleError(res, "Error al cambiar contraseña", {
      statusCode: HttpStatusCode.INTERNAL_SERVER,
      data: error
    });
  }
};





export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    // const user = await User.findOne<IUser>({ email })
    const user = await User.findOne<IUser>({
      email: { $regex: new RegExp("^" + email + "$", "i") },
    });

    if (!user || !user?.state) {
      return handleError(res, "Lo sentimos, no se ha encontrado ninguna coincidencia. Por favor, intente nuevamente.", {
        statusCode: HttpStatusCode.NOT_FOUND
      });
    }

    const token = sign(
      { uid: user._id },
      `${process.env.SECRETORPRIVATEKEYFORGOT}`,
      {
        expiresIn: "3m",
      }
    );
    console.log('token sendEmailPasswordForgot', token);
    
    // Genera un codigo numerico de 8 sifras, expira en 5 minutos y lo almacena en la base de datos
    const verificationCode = await generateVerificationCode(
      user._id!.toString()
    );

    // Envia un correo electronico al usuario con el co digo
    sendEmailPasswordForgot({ verificationCode, email: user.email });
    // Devuelto el token
    res.status(200).json(token);
  } catch (error) {
    handleError(res, "Revise su correo electrónico para obtener un enlace para restablecer su contraseña", {
      data: error
    });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  const { code } = req.body;
  const user = <IUser>req.user;

  try {
    // octengo el codigo de verificación de la base de datos
    const resp = await VerificationCode.findOne<ICode>({ userId: user._id }).sort(
      { createdAt: -1 }
    ); // Ordenar por `createdAt` en orden descendente

    // Verifico si el codigo existe
    if (!resp) {
      return handleError(res, "Código expirado", {
        statusCode: HttpStatusCode.UNAUTHORIZED
      });
    }

    // Verifico si el codigo es el mismo que envio el usuario
    if (resp.code === code) {
      res.status(200).json({ msg: "Code OK" });
      return;
    }

    return handleError(res, "Código inválido", {
      statusCode: HttpStatusCode.UNAUTHORIZED
    });
  } catch (error) {
    handleError(res, "Error al verificar código", {
      statusCode: HttpStatusCode.INTERNAL_SERVER,
      data: error
    });
  }
};

export const newForgotPassword = async (req: Request, res: Response) => {
  const { password } = req.body;
  const id = req.user?.id;
  
  try {
    // Guardo la nueva contraseña
    const user = await User.findByIdAndUpdate(id, {
      password: encrypt(password),
    });

    if (!user) {
      return handleError(res, "Error al actualizar contraseña", {
        statusCode: HttpStatusCode.BAD_REQUEST
      });
    }

    res.status(200).json({msg: 'Contraseña actualizada correctamente'});
  } catch (error) {
    handleError(res, "Error al crear nueva contraseña", {
      statusCode: HttpStatusCode.INTERNAL_SERVER,
      data: error
    });
  }
};
