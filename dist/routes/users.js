"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const users_1 = require("../controllers/users");
const db_validators_1 = require("../helpers/db-validators");
const middlewares_1 = require("../middlewares");
const router = (0, express_1.Router)();
router.get('/', users_1.getUsers);
router.get('/:id', [
    (0, express_validator_1.check)('id', 'ID is invalid').isMongoId(),
    // check('id').custom(userExists),
    middlewares_1.validateFields
], users_1.getUser);
router.post('/', [
    (0, express_validator_1.check)('name', 'Name is required').not().isEmpty(),
    (0, express_validator_1.check)('userName', 'UserName is required').not().isEmpty(),
    (0, express_validator_1.check)('password', 'The password must have more than 6 letters').isLength({ min: 6, max: 15 }),
    (0, express_validator_1.check)('email', 'Email is invalid').isEmail(),
    (0, express_validator_1.check)('email').custom(db_validators_1.emailExists),
    (0, express_validator_1.check)('userName').custom(db_validators_1.userNameExists),
    middlewares_1.validateFields
], users_1.createUser);
router.put('/:id', [
    (0, express_validator_1.check)('id', 'ID is invalid').isMongoId(),
    (0, express_validator_1.check)('id').custom(db_validators_1.userExists),
    middlewares_1.validateFields
], users_1.updateUser);
router.delete('/:id', [
    middlewares_1.validateJWT,
    middlewares_1.isAdminRole,
    (0, express_validator_1.check)('id', 'ID is invalid').isMongoId(),
    (0, express_validator_1.check)('id').custom(db_validators_1.userExists),
    middlewares_1.validateFields
], users_1.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map