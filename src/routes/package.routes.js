import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createPackage,
  listPackages,
  getPackageById,
  updatePackage,
  deletePackage,
} from "../controllers/package.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", listPackages);
router.get("/:id", getPackageById);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createPackage);
router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updatePackage);
router.delete("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), deletePackage);

export default router;
