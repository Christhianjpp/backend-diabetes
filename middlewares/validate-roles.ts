import { NextFunction, Request, Response } from "express"
import { IUser } from '../interfaces/user';


const isAdminRole = (req: Request, res: Response, next: NextFunction) => {

    if (!req.user) {
        return res.status(500).json({
            msg: 'Need_token'
        })
    }
    const { rol, name } = <IUser>req.user

    if (rol !== 'ADMIN_ROLE') {
        return res.status(401).json({
            msg: `${name} is not administrator`
        })
    }

    next()
}



export {
    isAdminRole
}