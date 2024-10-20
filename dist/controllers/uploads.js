"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.actualizarImagenCloudinary = exports.mostrarImagen = exports.actualizarImagen = exports.cargarArchivo = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config(`${process.env.CLOUDINARY_URL}`);
const subir_archivo_1 = __importDefault(require("../helpers/subir-archivo"));
const route_1 = __importDefault(require("../models/route"));
const user_1 = __importDefault(require("../models/user"));
const cargarArchivo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // const nombre = await subirArchivo(req.files, ['txt'], 'textos')
        const nombre = yield (0, subir_archivo_1.default)(req.files, undefined, 'img');
        res.json({
            nombre
        });
    }
    catch (error) {
        res.json({ msg: error });
    }
});
exports.cargarArchivo = cargarArchivo;
const actualizarImagen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, coleccion } = req.params;
    let modelo;
    switch (coleccion) {
        case 'users':
            modelo = yield user_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                });
            }
            break;
        case 'route':
            modelo = yield route_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe una ruta con el id ${id}`
                });
            }
            break;
        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }
    try {
        // Limpiar imagen previa
        if (modelo.img) {
            // Borrar imagen
            const pathImagen = path_1.default.join('./uploads', coleccion, modelo.img);
            if (fs_1.default.existsSync(pathImagen)) {
                fs_1.default.unlinkSync(pathImagen);
            }
        }
        // Subir Imagen
        const nombre = yield (0, subir_archivo_1.default)(req.files, undefined, coleccion);
        modelo.img = nombre;
        yield modelo.save();
        res.json(modelo);
    }
    catch (error) {
        console.log(error);
        res.json({
            msg: error
        });
    }
});
exports.actualizarImagen = actualizarImagen;
const mostrarImagen = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, coleccion } = req.params;
    let modelo;
    switch (coleccion) {
        case 'users':
            modelo = yield user_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                });
            }
            break;
        case 'route':
            modelo = yield route_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe una ruta con el id ${id}`
                });
            }
            break;
        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }
    try {
        // Limpiar imagen previa
        if (modelo.img) {
            // Borrar imagen
            const pathImagen = path_1.default.join('./uploads', coleccion, modelo.img);
            if (fs_1.default.existsSync(pathImagen)) {
                return res.sendFile(pathImagen, { root: '.' });
            }
        }
        const pathImagen = path_1.default.join('./assets/no-image.jpg');
        res.sendFile(pathImagen, { root: '.' });
    }
    catch (error) {
        console.log({ error });
        res.json({
            msg: error
        });
    }
});
exports.mostrarImagen = mostrarImagen;
const actualizarImagenCloudinary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id, coleccion } = req.params;
    let modelo;
    switch (coleccion) {
        case 'users':
            modelo = yield user_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe un usuario con el id ${id}`
                });
            }
            break;
        case 'route':
            modelo = yield route_1.default.findById(id);
            if (!modelo) {
                return res.status(400).json({
                    msg: `No existe una ruta con el id ${id}`
                });
            }
            break;
        default:
            return res.status(500).json({ msg: 'Se me olvidó' });
    }
    try {
        // Limpiar imagen previa
        if (modelo.img) {
            //Obtener public id de la imagen
            const nombreArr = modelo.img.split('/');
            const nombre = nombreArr[nombreArr.length - 1];
            const [public_id] = nombre.split('.');
            // Borrar imagen
            cloudinary_1.v2.uploader.destroy(public_id);
        }
        const { tempFilePath } = (_a = req.files) === null || _a === void 0 ? void 0 : _a.archivo;
        const { secure_url } = yield cloudinary_1.v2.uploader.upload(tempFilePath);
        // Subir Imagen
        modelo.img = secure_url;
        yield modelo.save();
        res.status(200).json({ user: modelo });
    }
    catch (error) {
        console.log(error);
        res.json({
            msg: error
        });
    }
});
exports.actualizarImagenCloudinary = actualizarImagenCloudinary;
//# sourceMappingURL=uploads.js.map