import { Request, Response } from "express";
import User from "../models/user";
import { IUser } from "../interfaces/user";
import { encrypt } from "../helpers/bcrypt-handle";
import handleError from "../helpers/error-handle";
import generatJWT from "../helpers/generate-jwt";
import { userName } from "../helpers/userCreateName";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { desde = 0, limit = 5 } = req.params;
    const query = { state: true };

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query).skip(Number(desde)).limit(Number(limit)),
    ]);

    res.status(200).json({ total, users });
  } catch (error) {
    handleError(res, "ERROR_GET_USERS", error);
  }
};
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return handleError(res, `User: ${id}, does not exist`);
    }
    res.status(200).json({ user });
  } catch (error) {
    handleError(res, "ERROR_GET_USER", error);
  }
};
export const createUser = async (req: Request, res: Response) => {
  console.log("createUser");

  try {
    const { name, email, password } = <IUser>req.body;
    console.log(name, email, password);
    const user = new User({
      userName: userName(name),
      name: name.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });

    user.password = encrypt(password);
    await user.save();

    const token = await generatJWT(user.id);
    res.status(201).json({ user, token });
  } catch (error) {
    handleError(res, "ERROR_PUT_USER", error);
    console.log(error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { password, google, email, ...resto }: IUser = req.body;
    console.log({ resto });
    console.log(id);

    const user = <IUser>await User.findByIdAndUpdate(id, resto, { new: true });
    console.log({ user });

    res.status(200).json({ user });
  } catch (error) {
    handleError(res, "ERROR_PUT_USER", error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { state: false }, { new: true });

    res.status(200).json({ msg: "Deleted user" });
  } catch (error) {
    handleError(res, "ERROR_DELETE_USER", error);
  }
};
