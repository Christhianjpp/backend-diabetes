import { Router } from "express";
import { check } from "express-validator";
import {
  changePassword,
  forgotPassword,
  googleSignIn,
  login,
  newForgotPassword,
  validarTokenUser,
  verifyCode,
} from "../controllers/auth";
import validateFields from "../middlewares/validate-fields";
import { validateJWT } from "../middlewares";
import validateJWTForgot from "../middlewares/validate-jwt-forgot";

const router = Router();

router.get("/check-status", [validateJWT], validateFields, validarTokenUser);

router.post(
  "/login",
  [
    check("email", "Email is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check("password", "Password is required").not().isEmpty(),
    check(
      "password",
      "La contraseña debe tener entre 6 y 20 caracteres"
    ).isLength({ min: 6, max: 20 }),
    validateFields,
  ],
  login
);


router.post(
  "/google",
  [check("id_token", "id_token is requerired").not().isEmpty(), validateFields],
  googleSignIn
);

router.post(
  "/change-password",
  [
    validateJWT,
    check("currentPassword", "Current password is required").not().isEmpty(),
    check("newPassword", "New password is required").not().isEmpty(),
    validateFields,
  ],
  changePassword
);

router.post(
  "/forgot-password",
  [
    check("email", "Email is required").not().isEmpty(),
    validateFields,
    check("email", "Email is invalid").isEmail(),
    validateFields,
  ],
  forgotPassword
);

router.post(
  "/verify-reset-code",
  [
    validateJWTForgot,
    check("code", "code is required").not().isEmpty(),
    check("code", "The code must have more than 8 letters").isLength({
      min: 4,
      max: 4,
    }),
    check("code", "New code is required").not().isEmpty(),
    check("code", "The new code must have more than 8 letters").isLength({
      min: 4,
      max: 4,
    }),
    validateFields,
  ],
  verifyCode
);
router.put(
  "/new-password-forgot",
  [
    validateJWTForgot,
    check("password", "Password is required").not().isEmpty(),
    check("password", "The password must have more than 6 letters").isLength({
      min: 6,
      max: 15,
    }),
    validateFields,
  ],
  newForgotPassword
);

export default router;
