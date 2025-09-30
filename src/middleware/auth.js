import jwt from "jsonwebtoken";

/**
 * Kiểm tra access token. Nếu required=true thì thiếu/invalid token sẽ bị chặn.
 */
export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return required
        ? res.status(401).json({ message: "Thiếu hoặc sai token" })
        : next();
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = payload; // { id, role }
      next();
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn" });
    }
  };
}
