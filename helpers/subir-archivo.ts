import { type } from "os";

import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { UploadedFile } from "../interfaces/uploads";

interface Props {
    files: UploadedFile;
    extensionesValidas?: [];
    carpeta?: string
}


const subirArchivo = (files: any, extensionesValidas = ['png', 'jpg', 'jpeg', 'gif'], carpeta = ''): Promise<string> => {

    return new Promise<any>((resolve, reject) => {

        const { name, mv } = <UploadedFile>files.archivo;

        // Obtener extension
        const nombreCortado = name.split('.')
        const extension = nombreCortado[nombreCortado.length - 1]

        //Validar extension
        if (!extensionesValidas.includes(extension)) {
            return reject(`La extensión ${extension} no es permitida - ${extensionesValidas}`);
        }

        // Cambiar nombre del archivo
        const nombreTemp = uuidv4() + '.' + extension

        const uploadPath = path.join('./uploads', carpeta, nombreTemp);

        mv(uploadPath, (err: any) => {
            if (err) {
                return reject(err)
            }

            resolve(nombreTemp);
        });


    })

}

export default subirArchivo

