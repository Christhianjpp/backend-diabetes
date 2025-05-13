"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const db_validators_1 = require("../helpers/db-validators");
const validate_fields_1 = __importDefault(require("../middlewares/validate-fields"));
const validate_files_1 = __importDefault(require("../middlewares/validate-files"));
const uploads_1 = require("../controllers/uploads");
const router = (0, express_1.Router)();
router.post('/', [validate_files_1.default], uploads_1.cargarArchivo);
router.put('/:coleccion/:id', [
    validate_files_1.default,
    (0, express_validator_1.check)('id', 'El id debe ser de mongo').isMongoId(),
    (0, express_validator_1.check)('coleccion').custom(c => (0, db_validators_1.coleccionesPermitidas)(c, ['users', 'route'])),
    validate_fields_1.default
], uploads_1.actualizarImagenCloudinary);
// ], actualizarImagen)
router.get('/:coleccion/:id', [
    (0, express_validator_1.check)('id', 'El id debe ser de mongo').isMongoId(),
    (0, express_validator_1.check)('coleccion').custom(c => (0, db_validators_1.coleccionesPermitidas)(c, ['users', 'route'])),
    validate_fields_1.default
], uploads_1.mostrarImagen);
exports.default = router;
//# sourceMappingURL=uploads.js.map