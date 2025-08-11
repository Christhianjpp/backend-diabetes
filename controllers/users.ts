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
  } catch (error: any) {
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
  } catch (error: any) {
    handleError(res, "ERROR_GET_USER", error);
  }
};

export const capitalizeName = (name: string): string => {
  return name
    .trim() // elimina espacios al inicio y al final
    .split(/\s+/) // divide por uno o más espacios
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};

export const createUser = async (req: Request, res: Response) => {
  console.log("createUser");


  
  try {
    const { name, email, password } = <IUser>req.body;
    console.log(name, email, password);
    const user = new User({
      userName: userName(name),
      name: capitalizeName(name),
      email: email.toLowerCase(),
      password,
    });
    console.log(user);

    user.password = encrypt(password);
    await user.save();

    const token = await generatJWT(user.id);
    res.status(201).json({ user, token });
  } catch (error: any) {
    handleError(res, "ERROR_CREATE_USER", error);
    console.log(error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  console.log("updateUser");
  try {
    const id = req.params.id;
    const { password, google, email, ...resto }: IUser = req.body;
    
console.log(resto);

    const user = <IUser>await User.findByIdAndUpdate(id, resto, { new: true });
   

    res.status(200).json({ user });
  } catch (error: any) {
    handleError(res, "ERROR_UPDATE_USER", error);
  }
};

export const updateProfileVisibility = async (req: Request, res: Response) => {
  console.log('updateProfileVisibility');

  try {
    const { id } = req.params;
    const { profileVisibility } = req.body as { profileVisibility: string };
    console.log('profileVisibility', profileVisibility);
    if (!['private', 'connections', 'connections_groups', 'public'].includes(profileVisibility)) {
      return handleError(res, 'Invalid profile visibility value');
    }

    const user = await User.findByIdAndUpdate(
      id,
      { profileVisibility },
      { new: true }
    );
    if (!user) {
      return handleError(res, `User: ${id}, does not exist`);
    }
    res.status(200).json({ user });
  } catch (error: any) {
    handleError(res, 'ERROR_UPDATE_PROFILE_VISIBILITY', error);
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  console.log('updateNotificationPreferences');
  try {
    const { id } = req.params;
    const { push, email, app } = req.body as {
      push?: boolean;
      email?: boolean;
      app?: boolean;
    };

    // Construimos dinámicamente solo los campos presentes
    const fieldsToUpdate: Record<string, boolean> = {};
    if (typeof push === 'boolean') fieldsToUpdate['notificationPreferences.push'] = push;
    if (typeof email === 'boolean') fieldsToUpdate['notificationPreferences.email'] = email;
    if (typeof app === 'boolean') fieldsToUpdate['notificationPreferences.app'] = app;

    const user = await User.findByIdAndUpdate(id, fieldsToUpdate, { new: true });
    if (!user) {
      return handleError(res, `User: ${id}, does not exist`);
    }

    res.status(200).json({ user });
  } catch (error: any) {
    handleError(res, 'ERROR_UPDATE_NOTIFICATION_PREFERENCES', error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await User.findByIdAndUpdate(id, { state: false }, { new: true });

    res.status(200).json({ msg: "Deleted user" });
  } catch (error: any) {
    handleError(res, "ERROR_DELETE_USER", error);
  }
};
