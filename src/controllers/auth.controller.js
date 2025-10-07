import crypto from "crypto";
import User from "../models/User.js";
import { signTokens, verifyRefresh } from "../services/auth.service.js";
import { sendMail } from "../services/email.service.js";
import { ROLES } from "../constants/roles.js";

/** Tạo mã gồm 6 chữ số */
function generateCode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(crypto.randomInt(min, max));
}

export async function register(req, res) {
  const { fullName, email, password, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "Email đã tồn tại" });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role: role || ROLES.RECEPTION,
  });

  const code = generateCode();
  user.codes.push({
    code,
    purpose: "verify",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  await user.save();
  try {
    await sendMail({
      to: email,
      subject: "Xác minh email",
      html: `<p>Mã xác minh của bạn là <b>${code}</b> (hết hạn sau 15 phút).</p>`,
    });
  } catch (err) {
    // Không tiết lộ chi tiết lỗi cho client; chỉ log server-side
    console.error(
      "[register] Gửi email xác minh thất bại:",
      err?.message || err
    );
    // Tiếp tục trả về thành công để tránh lộ thông tin và đảm bảo UX
  }

  return res.status(201).json({
    message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh.",
  });
}

export async function verifyEmail(req, res) {
  const { email, code } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const index = user.codes.findIndex(
    (c) => c.purpose === "verify" && c.code === code && c.expiresAt > new Date()
  );

  if (index === -1)
    return res.status(400).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });

  user.isEmailVerified = true;
  user.codes.splice(index, 1);
  await user.save();

  return res.json({ message: "Xác minh email thành công" });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ message: "Sai thông tin đăng nhập" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Sai thông tin đăng nhập" });

  // Kiểm tra email đã được xác minh chưa
  if (!user.isEmailVerified) {
    return res.status(403).json({
      message: "Vui lòng xác minh email trước khi đăng nhập",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
  }

  const tokens = signTokens(user);
  return res.json({
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    ...tokens,
  });
}

export async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  try {
    const payload = verifyRefresh(refreshToken);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: "Token không hợp lệ" });

    const tokens = signTokens(user);
    return res.json(tokens);
  } catch (err) {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Trả về chung chung để tránh lộ thông tin user
  if (!user) {
    return res.json({
      message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu.",
    });
  }

  const code = generateCode();
  user.codes.push({
    code,
    purpose: "reset",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });
  await user.save();
  try {
    await sendMail({
      to: email,
      subject: "Mã đặt lại mật khẩu",
      html: `<p>Mã đặt lại mật khẩu của bạn là <b>${code}</b> (hết hạn sau 15 phút).</p>`,
    });
  } catch (err) {
    console.error(
      "[forgotPassword] Gửi email đặt lại mật khẩu thất bại:",
      err?.message || err
    );
  }

  return res.json({
    message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu.",
  });
}

export async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "Không tìm thấy người dùng" });

  const index = user.codes.findIndex(
    (c) => c.purpose === "reset" && c.code === code && c.expiresAt > new Date()
  );
  if (index === -1)
    return res.status(400).json({ message: "Mã không hợp lệ hoặc đã hết hạn" });

  user.passwordHash = await User.hashPassword(newPassword);
  user.codes.splice(index, 1);
  await user.save();

  return res.json({ message: "Đổi mật khẩu thành công" });
}

export async function resendVerification(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email là bắt buộc" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "Không tìm thấy người dùng" });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email đã được xác minh" });
  }

  // Xóa code cũ nếu có
  user.codes = user.codes.filter((c) => c.purpose !== "verify");

  // Tạo code mới
  const code = Math.random().toString().slice(2, 8);
  user.codes.push({
    code,
    purpose: "verify",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
  });

  await user.save();

  // Gửi email
  try {
    await sendMail({
      to: user.email,
      subject: "Xác minh email",
      html: `<p>Xin chào ${user.fullName},</p><p>Mã xác minh của bạn là <b>${code}</b> (hết hạn sau 10 phút).</p>`,
    });
    return res.json({
      message: "Đã gửi lại email xác minh",
      email: user.email,
    });
  } catch (error) {
    console.error("Lỗi gửi email xác minh:", error);
    return res.status(500).json({
      message: "Không thể gửi email xác minh",
    });
  }
}
