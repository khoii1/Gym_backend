import { Router } from "express";
import { body } from "express-validator";
import { runValidations } from "../middleware/validate.js";
import { sendMail } from "../services/email.service.js";

const router = Router();

router.post(
  "/send-email",
  [
    body("to").isEmail(),
    body("subject").isString().notEmpty(),
    body("html").isString().notEmpty(),
  ],
  runValidations,
  async (req, res) => {
    const { to, subject, html } = req.body;
    try {
      const result = await sendMail({ to, subject, html });
      return res.json({
        message: "Đã gửi email",
        result: { statusCode: result?.statusCode || 202 },
      });
    } catch (err) {
      console.error(
        "[debug/send-email] Lỗi gửi email:",
        err?.response?.body || err?.message || err
      );
      return res
        .status(500)
        .json({
          message: "Gửi email thất bại",
          error: err?.message || String(err),
        });
    }
  }
);

export default router;
