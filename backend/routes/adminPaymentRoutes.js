import express from "express";
import {
  getPaymentSummary,
  getAllPayments,
  updatePaymentStatusByAccountant,
} from "../controllers/adminPaymentController.js";
import {
  protectAdmin,
  authorizeAdminOrAccountant,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/summary", protectAdmin, authorizeAdminOrAccountant, getPaymentSummary);

router.get("/", protectAdmin, authorizeAdminOrAccountant, getAllPayments);

router.patch(
  "/:id/status",
  protectAdmin,
  authorizeAdminOrAccountant,
  updatePaymentStatusByAccountant
);

export default router;