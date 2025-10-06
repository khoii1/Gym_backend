import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createRegistration,
  listRegistrations,
  getRegistrationById,
  updateRegistrationStatus,
  getMemberActivePackages,
} from "../controllers/registration.controller.js";

const router = Router();

router.use(auth(true));

router.get(
  "/",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  listRegistrations
);

router.post(
  "/",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  createRegistration
);

router.get(
  "/:id",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION),
  getRegistrationById
);

router.put(
  "/:id/status",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  updateRegistrationStatus
);

router.get(
  "/member/:memberId/active",
  requireRole(ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION, ROLES.TRAINER),
  getMemberActivePackages
);

export default router;
