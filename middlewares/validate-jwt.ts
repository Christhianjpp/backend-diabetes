import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from 'jsonwebtoken';
import User from "../models/user";

interface IDecode {
    uid: string,
    iat: number,
    exp: number
}

// interface RequesEXT extends Request {
//     user?: string | JwtPayload;
// }

const validateJWT = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('x-token')
    console.log(token)
    if (!token) {
        return res.status(401).json({
            msg: 'There is no token in the request'
        })
    }
    try {


        // const { uid } = jwt.verify(token, SECRET_KEY)

        const { uid }: any = jwt.verify(token, `${process.env.SECRETORPRIVATEKEY}`)

        const user = await User.findById(uid)

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

export default validateJWT