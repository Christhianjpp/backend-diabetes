import { Router } from "express";
import { check } from 'express-validator'
import { login } from "../controllers/auth";
import validateFields from "../middlewares/validate-fields";

const router = Router()

router.post('/login', [
    check('email', 'Email is required').isEmail(),
    check('password', 'Password is required').not().isEmpty(),
    validateFields
], login);

export default router;