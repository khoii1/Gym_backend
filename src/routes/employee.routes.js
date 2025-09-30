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
} from "../controllers/employee.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listEmployees);

router.post(
  "/",
  [
    requireRole(ROLES.ADMIN, ROLES.MANAGER),
    body("full_name").notEmpty(),
    body("role").notEmpty(),
  ],
  runValidations,
  createEmployee
);

router.get("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), getEmployee);

router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updateEmployee);

router.delete("/:id", requireRole(ROLES.ADMIN), deleteEmployee);

export default router;
