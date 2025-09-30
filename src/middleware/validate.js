import { validationResult } from "express-validator";

/**
 * Gom lỗi validate và trả về 400 nếu có lỗi.
 */
export function runValidations(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ errors: result.array() });
  }
  next();
}
