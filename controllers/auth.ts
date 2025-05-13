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

export const validarTokenUser = async (req: Request, res: Response) => {
  console.log("validarTokenUser");

  try {
    const user = req.user;

    const token = await generatJWT(user!._id);
    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Error Token",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password }: IAuth = req.body;
  const regex = new RegExp(email, "i");

  try {
    const user = await User.findOne({ email: regex });
    if (!user) {
      return res.status(400).json({
        msg: "Email or password is incorrect",
      });
    }
    if (!user.state) {
      return res.status(400).json({
        msg: "Email or password is incorrect",
      });
    }
    const validPassword = verfied(password, user.password);

    if (!validPassword) {
      return res.status(400).json({
        msg: "Email or password is incorrect",
      });
    }
    const token = await generatJWT(user.id);

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      msg: "Talk to the administrator",
    });
  }
};


export const googleSignIn = async (req: Request, res: Response) => {
  console.log("googleSignIn");

  const { id_token } = req.body;
  try {
    const { name, img, email } = await googleVerify(id_token);

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
      return res.status(401).json({
        msg: "User blocked",
      });
    }

    const token = await generatJWT(user.id);

    res.json({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      msg: "Error Token Google",
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
      return res.status(404).json({
        msg: "Lo sentimos, no se ha encontrado ninguna coincidencia. Por favor, intente nuevamente.",
      });
    }

    const token = sign(
      { uid: user._id },
      `${process.env.SECRETORPRIVATEKEYFORGOT}`,
      {
        expiresIn: "3m",
      }
    );

    // Genera un codigo numerico de 8 sifras, expira en 5 minutos y lo almacena en la base de datos
    const verificationCode = await generateVerificationCode(
      user._id!.toString()
    );

    // Envia un correo electronico al usuario con el co digo
    sendEmailPasswordForgot({ verificationCode, email: user.email });
    // Devuelto el token
    res.status(200).json(token);
  } catch (error) {
    console.log(error);
    return res.json({
      msg: "Revise su correo electrónico para obtener un enlace para restablecer su contraseña",
    });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  console.log("verifyCode");

  const { code } = req.body;
  const user = <IUser>req.user;

  // octengo el codigo de verificación de la base de datos

  const resp = await VerificationCode.findOne<ICode>({ userId: user._id }).sort(
    { createdAt: -1 }
  ); // Ordenar por `createdAt` en orden descendente
  console.log("resp", resp);

  // Verifico si el codigo existe
  if (!resp) {
    res.status(401).json({ msg: "Expired Code" });
    return;
  }

  console.log(resp.code, code);

  // Verifico si el codigo es el mismo que envio el usuario
  if (resp.code === code) {
    res.status(200).json({ msg: "Code OK" });
    return;
  }

  res.status(401).json({ msg: "Invalid Code" });
};
export const newForgotPassword = async (req: Request, res: Response) => {
  console.log("first");

  const { password } = req.body;
  console.log({ password });

  const id = req.user?.id;
  try {
    // Guardo la nueva contraseña
    const user = await User.findByIdAndUpdate(id, {
      password: encrypt(password),
    });

    if (!user) {
      res.status(400).json({ msg: "Error Update Password" });
      return;
    }

    // creo un nuevo token
    const token = await generatJWT(user.id);
    console.log(user);

    res.status(200).json({
      user,
      token,
    });
  } catch (error) {
    console.log(error);
    return res.json({ msg: "Error New Password" });
  }
};
