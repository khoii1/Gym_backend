import { Router } from "express";
import { body } from "express-validator";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { runValidations } from "../middleware/validate.js";
import { ROLES } from "../constants/roles.js";
import {
  createEmployee,
  listEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStatistics,
  searchEmployees,
  getEmployeesByDepartment,
  getEmployeesByPosition,
} from "../controllers/employee.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listEmployees);

// New enhanced routes - must come before /:id route
router.get(
  "/statistics/overview",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  getEmployeeStatistics
);

router.get(
  "/search/query",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  searchEmployees
);

router.get(
  "/department/:department",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  getEmployeesByDepartment
);

router.get(
  "/position/:position",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  getEmployeesByPosition
);

router.post(
  "/",
  [
    requireRole(ROLES.ADMIN, ROLES.MANAGER),
    body("fullName").notEmpty().withMessage("Họ tên là bắt buộc"),
    body("email").isEmail().withMessage("Email hợp lệ là bắt buộc"),
    body("phone").notEmpty().withMessage("Số điện thoại là bắt buộc"),
    body("position").notEmpty().withMessage("Vị trí là bắt buộc"),
  ],
  runValidations,
  createEmployee
);

router.get("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), getEmployee);

router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updateEmployee);

router.delete("/:id", requireRole(ROLES.ADMIN), deleteEmployee);

export default router;
