import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  checkIn,
  checkOut,
  getMemberAttendance,
  getTodayAttendance,
  listAttendance,
  getAttendanceOverview,
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
  checkIn
);

router.post(
  "/checkout",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  checkOut
);

router.get(
  "/today",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getTodayAttendance
);

router.get(
  "/member/:memberId",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getMemberAttendance
);

router.get(
  "/overview",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getAttendanceOverview
);

export default router;
