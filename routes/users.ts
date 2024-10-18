import { Router } from 'express'
import { check } from 'express-validator'


import { createUser, deleteUser, getUser, getUsers, updateUser } from '../controllers/users';
import { emailExists, userExists, userNameExists } from '../helpers/db-validators';
import { isAdminRole, validateFields, validateJWT } from '../middlewares';
const router = Router();

router.get('/', getUsers);

router.get('/:id', [
    check('id', 'ID is invalid').isMongoId(),
    // check('id').custom(userExists),

    validateFields
], getUser);

router.post('/', [
    check('name', 'Name is required').not().isEmpty(),
    check('userName', 'UserName is required').not().isEmpty(),
    check('password', 'The password must have more than 6 letters').isLength({ min: 6, max: 15 }),
    check('email', 'Email is invalid').isEmail(),
    check('email').custom(emailExists),
    check('userName').custom(userNameExists),
    validateFields
], createUser);

router.put('/:id', [
    check('id', 'ID is invalid').isMongoId(),
    check('id').custom(userExists),
    validateFields
], updateUser);

router.delete('/:id', [
    validateJWT,
    isAdminRole,
    check('id', 'ID is invalid').isMongoId(),
    check('id').custom(userExists),
    validateFields
], deleteUser);


export default router;