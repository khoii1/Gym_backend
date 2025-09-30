import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createWorkSchedule,
  listWorkSchedules,
} from "../controllers/workSchedule.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listWorkSchedules);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createWorkSchedule);

export default router;
