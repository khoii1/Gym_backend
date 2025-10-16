import { UserAuthService } from "../services/user-auth.service.js";

export async function register(req, res) {
  try {
    const { fullName, email, password, role } = req.body;

    const { user, emailSent } = await UserAuthService.processRegistration({
      fullName,
      email,
      password,
      role,
    });

    return res.status(201).json({
      message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh.",
    });
  } catch (error) {
    if (error.message === "Email đã tồn tại") {
      return res.status(409).json({ message: error.message });
    }

    console.error("[register] Lỗi đăng ký:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi đăng ký",
      error: error.message,
    });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    const user = await UserAuthService.verifyEmailWithCode(email, code);

    return res.json({ message: "Xác minh email thành công" });
  } catch (error) {
    if (error.message === "Không tìm thấy người dùng") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Mã không hợp lệ hoặc đã hết hạn") {
      return res.status(400).json({ message: error.message });
    }

    console.error("[verifyEmail] Lỗi xác minh email:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi xác minh email",
      error: error.message,
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await UserAuthService.processLogin(email, password);

    return res.json(result);
  } catch (error) {
    if (error.message === "Sai thông tin đăng nhập") {
      return res.status(401).json({ message: error.message });
    }

    if (error.message === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({
        message: "Vui lòng xác minh email trước khi đăng nhập",
        code: "EMAIL_NOT_VERIFIED",
        email: req.body.email,
      });
    }

    console.error("[login] Lỗi đăng nhập:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi đăng nhập",
      error: error.message,
    });
  }
}

export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    const tokens = await UserAuthService.processRefreshToken(refreshToken);

    return res.json(tokens);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const result = await UserAuthService.processForgotPassword(email);

    return res.json({
      message: result.message,
    });
  } catch (error) {
    console.error("[forgotPassword] Lỗi forgot password:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi xử lý yêu cầu",
      error: error.message,
    });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    const user = await UserAuthService.processResetPassword(
      email,
      code,
      newPassword
    );

    return res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    if (error.message === "Không tìm thấy người dùng") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Mã không hợp lệ hoặc đã hết hạn") {
      return res.status(400).json({ message: error.message });
    }

    console.error("[resetPassword] Lỗi reset password:", error);
    return res.status(500).json({
      message: "Có lỗi xảy ra khi đổi mật khẩu",
      error: error.message,
    });
  }
}

export async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const { user, emailSent } = await UserAuthService.processResendVerification(
      email
    );

    return res.json({
      message: "Đã gửi lại email xác minh",
      email: user.email,
    });
  } catch (error) {
    if (error.message === "Không tìm thấy người dùng") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Email đã được xác minh") {
      return res.status(400).json({ message: error.message });
    }

    console.error("[resendVerification] Lỗi gửi lại email xác minh:", error);
    return res.status(500).json({
      message: "Không thể gửi email xác minh",
    });
  }
}
