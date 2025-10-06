import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createWorkSchedule,
  listWorkSchedules,
  getWorkScheduleById,
  updateWorkSchedule,
  deleteWorkSchedule,
} from "../controllers/workSchedule.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listWorkSchedules);
router.get(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  getWorkScheduleById
);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createWorkSchedule);
router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updateWorkSchedule);
router.delete(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  deleteWorkSchedule
);

export default router;
