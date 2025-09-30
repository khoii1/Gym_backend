import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  checkin,
  listAttendance,
} from "../controllers/attendance.controller.js";

const router = Router();

router.use(auth(true));

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  listAttendance
);

router.post(
  "/checkin",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  checkin
);

export default router;
