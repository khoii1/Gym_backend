import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createPackage,
  listPackages,
} from "../controllers/package.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", listPackages);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createPackage);

export default router;
