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
  validateDiscountCode,
  applyDiscount,
  getDiscountStatistics,
} from "../controllers/discount.controller.js";

const router = Router();

router.use(auth(true));

router.get("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), listDiscounts);
router.get("/active", getActiveDiscounts); // Anyone can see active discounts
router.get(
  "/statistics",
  requireRole(ROLES.ADMIN, ROLES.MANAGER),
  getDiscountStatistics
);
router.get("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), getDiscountById);

router.post("/", requireRole(ROLES.ADMIN, ROLES.MANAGER), createDiscount);
router.post("/validate", validateDiscountCode); // For checking discount codes
router.post("/apply", applyDiscount); // For applying discounts
router.put("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), updateDiscount);
router.delete("/:id", requireRole(ROLES.ADMIN, ROLES.MANAGER), deleteDiscount);

export default router;
