import { Router } from "express";
import { body } from "express-validator";
import { runValidations } from "../middleware/validate.js";
import {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  resendVerification,
} from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  [
    body("fullName").isString().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  runValidations,
  register
);

router.post(
  "/verify-email",
  [body("email").isEmail(), body("code").isLength({ min: 4 })],
  runValidations,
  verifyEmail
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  runValidations,
  login
);

router.post(
  "/refresh",
  [body("refreshToken").notEmpty()],
  runValidations,
  refreshToken
);

router.post(
  "/forgot-password",
  [body("email").isEmail()],
  runValidations,
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("email").isEmail(),
    body("code").isLength({ min: 4 }),
    body("newPassword").isLength({ min: 6 }),
  ],
  runValidations,
  resetPassword
);

router.post(
  "/resend-verification",
  [body("email").isEmail()],
  runValidations,
  resendVerification
);

export default router;
