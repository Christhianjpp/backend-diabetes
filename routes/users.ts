import { Router } from "express";
import { check } from "express-validator";

import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
  updateProfileVisibility,
  updateNotificationPreferences,
} from "../controllers/users";
import {
  emailExists,
  userExists,
  userNameExists,
} from "../helpers/db-validators";
import { isAdminRole, validateFields, validateJWT } from "../middlewares";
const router = Router();

router.get("/", getUsers);

router.get(
  "/:id",
  [
    check("id", "ID is invalid").isMongoId(),
    // check('id').custom(userExists),

    validateFields,
  ],
  getUser
);

router.post(
  "/",
  [
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("name", "El nombre debe tener entre 4 y 30 caracteres").isLength({
      min: 4,
      max: 30,
    }),
    check(
      "password",
      "La contraseña debe tener entre 6 y 20 caracteres"
    ).isLength({ min: 6, max: 20 }),
    check("email", "El correo no es válido").isEmail(),
    check("email").custom(emailExists), // Valida si el correo ya existe
    validateFields,
  ],

  createUser
);

router.patch(
  "/:id/notification-preferences",
  [
    validateJWT,
    check("id", "ID is invalid").isMongoId(),
    validateFields,
  ],
  updateNotificationPreferences
);

router.patch(
  "/:id/profile-visibility",
  [
    validateJWT,
    check("id", "ID is invalid").isMongoId(),
    check("profileVisibility", "profileVisibility is required").not().isEmpty(),
    validateFields,
  ],
  updateProfileVisibility
);

router.put(
  "/:id",
  [
    validateJWT,
    check("id", "ID is invalid").isMongoId(),
    check("id").custom(userExists),
    validateFields,
  ],
  updateUser
);

router.delete(
  "/:id",
  [
    validateJWT,
    isAdminRole,
    check("id", "ID is invalid").isMongoId(),
    check("id").custom(userExists),
    validateFields,
  ],
  deleteUser
);

export default router;
