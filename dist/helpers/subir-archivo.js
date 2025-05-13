"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const subirArchivo = (files, extensionesValidas = ['png', 'jpg', 'jpeg', 'gif'], carpeta = '') => {
    return new Promise((resolve, reject) => {
        const { name, mv } = files.archivo;
        // Obtener extension
        const nombreCortado = name.split('.');
        const extension = nombreCortado[nombreCortado.length - 1];
        //Validar extension
        if (!extensionesValidas.includes(extension)) {
            return reject(`La extensión ${extension} no es permitida - ${extensionesValidas}`);
        }
        // Cambiar nombre del archivo
        const nombreTemp = (0, uuid_1.v4)() + '.' + extension;
        const uploadPath = path_1.default.join('./uploads', carpeta, nombreTemp);
        mv(uploadPath, (err) => {
            if (err) {
                return reject(err);
            }
            resolve(nombreTemp);
        });
    });
};
exports.default = subirArchivo;
//# sourceMappingURL=subir-archivo.js.map