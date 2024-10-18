import { Request, Response } from "express"
import { IAuth } from "../interfaces/auth"
import User from "../models/user"
import { verfied } from "../helpers/bcrypt-handle"
import generatJWT from "../helpers/generate-jwt"

export const login = async (req: Request, res: Response) => {

    const { email, password }: IAuth = req.body
    const regex = new RegExp(email, 'i')

    try {
        const user = await User.findOne({ email: regex })
        if (!user) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            })
        }
        if (!user.state) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            })
        }
        const validPassword = verfied(password, user.password)

        if (!validPassword) {
            return res.status(400).json({
                msg: 'Email or password is incorrect'
            })
        }
        const token = await generatJWT(user.id)

        res.json({
            user,
            token
        })



    } catch (error) {
        console.log(error)
        res.status(500).json({
            msg: 'Talk to the administrator'
        })
    }
}

