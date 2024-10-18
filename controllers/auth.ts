import { Request, Response } from "express"
import { IAuth } from "../interfaces/auth"
import User from "../models/user"
import { verfied } from "../helpers/bcrypt-handle"
import generatJWT from "../helpers/generate-jwt"
import googleVerify from "../helpers/google-verify"
import { userNameGoogle } from "../helpers/userName-google"

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

export const googleSignIn = async (req: Request, res: Response) => {

    const { id_token } = req.body
    try {
        const { name, img, email } = await googleVerify(id_token)

        let user = await User.findOne({ email })

        if (!user) {
            // creo usuario
            const data = {
                userName: userNameGoogle(name),
                name: name.slice(0, 20),
                email,
                password: ':P',
                img,
                google: true,
            }
            user = new User(data);
            await user.save();
        }
        // Verificar estado del usuario
        if (!user.state) {
            return res.status(401).json({
                msg: 'User blocked'
            })
        }

        const token = await generatJWT(user.id)
        console.log(user)
        res.json({
            user,
            token
        })

    } catch (error) {
        console.log(error)
        res.status(400).json({
            msg: 'Error Token Google'
        })

    }
}

