import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createDiscount,
  listDiscounts,
} from "../controllers/discount.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listDiscounts);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createDiscount);

export default router;
