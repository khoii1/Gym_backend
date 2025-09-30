import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import { createMember, listMembers } from "../controllers/member.controller.js";

const router = Router();

router.use(auth(true));

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  listMembers
);

router.post(
  "/",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  createMember
);

export default router;
