import express from "express";
import {
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
} from "../controllers/adminBookingController.js";
import {
  protectAdmin,
  authorizeAdminOrManager,
  authorizeAdminOrAccountant,
} from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, authorizeAdminOrManager, getAllBookings);
router.get("/:id", protectAdmin, authorizeAdminOrManager, getSingleBooking);

router.patch(
  "/:id/status",
  protectAdmin,
  authorizeAdminOrManager,
  updateBookingStatus
);

router.patch(
  "/:id/payment-status",
  protectAdmin,
  authorizeAdminOrAccountant,
  updatePaymentStatus
);

router.delete("/:id", protectAdmin, authorizeAdminOrManager, deleteBooking);

export default router;