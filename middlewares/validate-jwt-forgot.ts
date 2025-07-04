import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from "../models/user";
import { IUser } from '../interfaces/user';

interface IDecode {
    uid: string,
    iat: number,
    exp: number
}

// interface RequesEXT extends Request {
//     user?: string | JwtPayload;
// }

const validateJWTForgot = async (req: Request, res: Response, next: NextFunction) => {
 
    const authHeader = req.header("Authorization");
  

    // const token = req.header('x-token')
    if (!authHeader) {
        return res.status(401).json({
          ok: false,
          msg: "No hay token en la petición"
        });
      }
      const token = authHeader.replace(/^Bearer\s+/, "");
   
      
    if (!token) {
        return res.status(401).json({
            msg: 'There is no token in the request'
        })
    }
    try {

        // const { uid } = jwt.verify(token, SECRET_KEY)
        const { uid }: any = jwt.verify(token, `${process.env.SECRETORPRIVATEKEYFORGOT}`)
        const user = await User.findById<IUser>(uid)

        if (!user) {
            return res.status(401).json({
                msg: 'There is no token in the request'
            })
        }
        if (!user.state) {
            return res.status(401).json({
                msg: 'There is no token in the request!'
            })
        }

        req.user = user

        next()
    } catch (error) {

        console.log(error)
        return res.status(401).json({
            msg: 'Token Expired Error'
        })
    }

}

export default validateJWTForgot