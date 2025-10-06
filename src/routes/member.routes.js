import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createMember,
  listMembers,
  getMemberById,
  updateMember,
  deleteMember,
  getMemberActivePackages,
} from "../controllers/member.controller.js";

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

router.get(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getMemberById
);

router.put(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  updateMember
);

router.delete("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), deleteMember);

router.get(
  "/:id/active-packages",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getMemberActivePackages
);

export default router;
