import { Router } from "express";
import { body } from "express-validator";
import { runValidations } from "../middleware/validate.js";
import { sendMail } from "../services/email.service.js";
import User from "../models/User.js";

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
      return res.status(500).json({
        message: "Gửi email thất bại",
        error: err?.message || String(err),
      });
    }
  }
);

// Debug route để lấy verification code của user
router.get("/user-codes/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const activeCodes = user.codes.filter(
      (code) => code.expiresAt > new Date()
    );

    return res.json({
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      activeCodes: activeCodes.map((code) => ({
        code: code.code,
        purpose: code.purpose,
        expiresAt: code.expiresAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

export default router;
