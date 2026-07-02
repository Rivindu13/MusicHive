import express from "express";
import {
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
  updatePaymentStatus,
  deleteBooking,
} from "../controllers/adminBookingController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllBookings);
router.get("/:id", protectAdmin, getSingleBooking);
router.patch("/:id/status", protectAdmin, updateBookingStatus);
router.patch("/:id/payment-status", protectAdmin, updatePaymentStatus);
router.delete("/:id", protectAdmin, deleteBooking);

export default router;