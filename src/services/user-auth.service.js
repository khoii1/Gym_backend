import crypto from "crypto";
import User from "../models/User.js";
import { signTokens, verifyRefresh } from "./auth.service.js";
import { sendMail } from "./email.service.js";
import { ROLES } from "../constants/roles.js";

export class UserAuthService {
  /** Tạo mã gồm 6 chữ số */
  static generateCode(length = 6) {
    const min = 10 ** (length - 1);
    const max = 10 ** length;
    return String(crypto.randomInt(min, max));
  }

  /** Tạo mã xác minh ngẫu nhiên 6 chữ số */
  static generateRandomCode() {
    return Math.random().toString().slice(2, 8);
  }

  /** Kiểm tra user tồn tại theo email */
  static async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  /** Tạo user mới */
  static async createUser({ fullName, email, password, role }) {
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      fullName,
      email,
      passwordHash,
      role: role || ROLES.RECEPTION,
    });
    return user;
  }

  /** Thêm verification code cho user */
  static async addVerificationCode(
    user,
    purpose = "verify",
    expiresInMinutes = 15
  ) {
    const code = this.generateCode();
    user.codes.push({
      code,
      purpose,
      expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    });
    await user.save();
    return code;
  }

  /** Gửi email xác minh */
  static async sendVerificationEmail(email, code) {
    try {
      await sendMail({
        to: email,
        subject: "Xác minh email",
        html: `<p>Mã xác minh của bạn là <b>${code}</b> (hết hạn sau 15 phút).</p>`,
      });
      return true;
    } catch (error) {
      console.error(
        "[sendVerificationEmail] Gửi email xác minh thất bại:",
        error?.message || error
      );
      return false;
    }
  }

  /** Gửi email reset password */
  static async sendResetPasswordEmail(email, code) {
    try {
      await sendMail({
        to: email,
        subject: "Mã đặt lại mật khẩu",
        html: `<p>Mã đặt lại mật khẩu của bạn là <b>${code}</b> (hết hạn sau 15 phút).</p>`,
      });
      return true;
    } catch (error) {
      console.error(
        "[sendResetPasswordEmail] Gửi email đặt lại mật khẩu thất bại:",
        error?.message || error
      );
      return false;
    }
  }

  /** Xử lý đăng ký user */
  static async processRegistration({ fullName, email, password, role }) {
    // Kiểm tra email đã tồn tại
    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new Error("Email đã tồn tại");
    }

    // Tạo user mới
    const user = await this.createUser({ fullName, email, password, role });

    // Tạo và gửi mã xác minh
    const code = await this.addVerificationCode(user);
    const emailSent = await this.sendVerificationEmail(email, code);

    return {
      user,
      emailSent,
    };
  }

  /** Xác minh email với code */
  static async verifyEmailWithCode(email, code) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    const index = user.codes.findIndex(
      (c) =>
        c.purpose === "verify" && c.code === code && c.expiresAt > new Date()
    );

    if (index === -1) {
      throw new Error("Mã không hợp lệ hoặc đã hết hạn");
    }

    user.isEmailVerified = true;
    user.codes.splice(index, 1);
    await user.save();

    return user;
  }

  /** Xử lý đăng nhập */
  static async processLogin(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Sai thông tin đăng nhập");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Sai thông tin đăng nhập");
    }

    // Kiểm tra email đã được xác minh chưa
    if (!user.isEmailVerified) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const tokens = signTokens(user);
    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  /** Xử lý refresh token */
  static async processRefreshToken(refreshToken) {
    try {
      const payload = verifyRefresh(refreshToken);
      const user = await User.findById(payload.id);
      if (!user) {
        throw new Error("Token không hợp lệ");
      }

      const tokens = signTokens(user);
      return tokens;
    } catch (error) {
      throw new Error("Token không hợp lệ");
    }
  }

  /** Xử lý forgot password */
  static async processForgotPassword(email) {
    const user = await this.findUserByEmail(email);

    // Luôn trả về success message để không lộ thông tin user
    if (!user) {
      return {
        success: true,
        message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu.",
      };
    }

    const code = await this.addVerificationCode(user, "reset", 15);
    const emailSent = await this.sendResetPasswordEmail(email, code);

    return {
      success: true,
      message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu.",
      emailSent,
    };
  }

  /** Xử lý reset password */
  static async processResetPassword(email, code, newPassword) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    const index = user.codes.findIndex(
      (c) =>
        c.purpose === "reset" && c.code === code && c.expiresAt > new Date()
    );

    if (index === -1) {
      throw new Error("Mã không hợp lệ hoặc đã hết hạn");
    }

    user.passwordHash = await User.hashPassword(newPassword);
    user.codes.splice(index, 1);
    await user.save();

    return user;
  }

  /** Xử lý gửi lại email xác minh */
  static async processResendVerification(email) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new Error("Không tìm thấy người dùng");
    }

    if (user.isEmailVerified) {
      throw new Error("Email đã được xác minh");
    }

    // Xóa code cũ nếu có
    user.codes = user.codes.filter((c) => c.purpose !== "verify");

    // Tạo code mới
    const code = this.generateRandomCode();
    user.codes.push({
      code,
      purpose: "verify",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
    });

    await user.save();

    // Gửi email
    const emailSent = await sendMail({
      to: user.email,
      subject: "Xác minh email",
      html: `<p>Xin chào ${user.fullName},</p><p>Mã xác minh của bạn là <b>${code}</b> (hết hạn sau 10 phút).</p>`,
    });

    return {
      user,
      emailSent: !!emailSent,
    };
  }
}
