import express from "express";
import {
  getAllBookings,
  getSingleBooking,
  updateBookingStatus,
  deleteBooking,
} from "../controllers/adminBookingController.js";
import { protectAdmin } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

router.get("/", protectAdmin, getAllBookings);
router.get("/:id", protectAdmin, getSingleBooking);
router.patch("/:id/status", protectAdmin, updateBookingStatus);
router.delete("/:id", protectAdmin, deleteBooking);

export default router;