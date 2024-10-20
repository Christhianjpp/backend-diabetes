import { Response, Request } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv'
dotenv.config();

import { v2 as cloudinary } from 'cloudinary'
cloudinary.config(`${process.env.CLOUDINARY_URL}`);

import subirArchivo from '../helpers/subir-archivo';

import User from '../models/user';

const cargarArchivo = async (req: Request, res: Response) => {
    try {
        // const nombre = await subirArchivo(req.files, ['txt'], 'textos')
        const nombre = await subirArchivo(req.files, undefined, 'img')
        res.json({
            nombre
        })
    } catch (error) {
        res.json({ msg: error })

    }
}

const actualizarImagen = async (req: Request, res: Response) => {

    const { id, coleccion } = req.params;
    let modelo;
    switch (coleccion) {
        case 'users':
            modelo = await User.findById(id)
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                })
            }
            break;

        // case 'route':
        //     modelo = await Route.findById(id)
        //     if (!modelo) {
        //         return res.status(400).json({
        //             msg: `No existe una ruta con el id ${id}`
        //         })
        //     }
        //     break;

        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }
    try {
        // Limpiar imagen previa
        if (modelo.img) {
            // Borrar imagen
            const pathImagen = path.join('./uploads', coleccion, modelo.img)
            if (fs.existsSync(pathImagen)) {
                fs.unlinkSync(pathImagen)
            }
        }

        // Subir Imagen
        const nombre = await subirArchivo(req.files, undefined, coleccion)
        modelo.img = nombre;

        await modelo.save();
        res.json(modelo)

    } catch (error) {
        console.log(error)
        res.json({
            msg: error
        })
    }
}

const mostrarImagen = async (req: Request, res: Response) => {

    const { id, coleccion } = req.params;

    let modelo;
    switch (coleccion) {
        case 'users':
            modelo = await User.findById(id)
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                })
            }
            break;

        // case 'route':
        //     modelo = await Route.findById(id)
        //     if (!modelo) {
        //         return res.status(400).json({
        //             msg: `No existe una ruta con el id ${id}`
        //         })
        //     }
        //     break;

        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }

    try {
        // Limpiar imagen previa
        if (modelo.img) {
            // Borrar imagen
            const pathImagen = path.join('./uploads', coleccion, modelo.img)

            if (fs.existsSync(pathImagen)) {

                return res.sendFile(pathImagen, { root: '.' })
            }
        }

        const pathImagen = path.join('./assets/no-image.jpg')
        res.sendFile(pathImagen, { root: '.' })

    } catch (error) {
        console.log({ error })
        res.json({
            msg: error
        })
    }
}


const actualizarImagenCloudinary = async (req: Request, res: Response) => {

    const { id, coleccion } = req.params;

    let modelo;

    switch (coleccion) {
        case 'users':
            modelo = await User.findById(id)
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                })
            }
            break;

        // case 'route':
        //     modelo = await Route.findById(id)
        //     if (!modelo) {
        //         return res.status(400).json({
        //             msg: `No existe una ruta con el id ${id}`
        //         })
        //     }
        //     break;

        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }
    try {


        // Limpiar imagen previa
        if (modelo.img) {
            //Obtener public id de la imagen
            const nombreArr = modelo.img.split('/')
            const nombre = nombreArr[nombreArr.length - 1]
            const [public_id] = nombre.split('.')
            // Borrar imagen
            cloudinary.uploader.destroy(public_id)
        }

        const { tempFilePath }: any = req.files?.archivo


        const { secure_url } = await cloudinary.uploader.upload(tempFilePath)

        // Subir Imagen
        modelo.img = secure_url;

        await modelo.save();

        res.status(200).json({ user: modelo })

    } catch (error) {
        console.log(error)
        res.json({
            msg: error
        })
    }
}



export {
    cargarArchivo,
    actualizarImagen,
    mostrarImagen,
    actualizarImagenCloudinary
}