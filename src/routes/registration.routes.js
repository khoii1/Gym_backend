import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createRegistration,
  listRegistrations,
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

export default router;
