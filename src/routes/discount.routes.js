import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";
import {
  createDiscount,
  listDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
  getActiveDiscounts,
} from "../controllers/discount.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listDiscounts);
router.get("/active", getActiveDiscounts); // Anyone can see active discounts
router.get("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), getDiscountById);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createDiscount);
router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updateDiscount);
router.delete("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), deleteDiscount);

export default router;
