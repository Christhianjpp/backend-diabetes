import { Router } from 'express'
import { check } from 'express-validator'

import { coleccionesPermitidas } from '../helpers/db-validators';

import validateFields from '../middlewares/validate-fields'
import validateFiles from '../middlewares/validate-files';
import { actualizarImagenCloudinary, cargarArchivo, mostrarImagen } from '../controllers/uploads';

const router = Router()


router.post('/', [validateFiles], cargarArchivo)


router.put('/:coleccion/:id', [
    validateFiles,
    check('id', 'El id debe ser de mongo').isMongoId(),
    check('coleccion').custom(c => coleccionesPermitidas(c, ['users', 'route'])),
    validateFields
], actualizarImagenCloudinary)
// ], actualizarImagen)

router.get('/:coleccion/:id', [
    check('id', 'El id debe ser de mongo').isMongoId(),
    check('coleccion').custom(c => coleccionesPermitidas(c, ['users', 'route'])),
    validateFields
], mostrarImagen)





export default router