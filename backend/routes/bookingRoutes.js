import express from "express";
const router = express.Router();

import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";

import { HOLD_MINUTES } from "../config/bookingConstants.js";
import { tomorrowYMD } from "../utils/date.js";

import { requireAuth } from "../middleware/requireAuth.js";

function isValidYMD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * POST /api/bookings/request (customer)
 * Body: { artistUid, date, slotType, note }
 * ✅ customerUid comes from Firebase token (req.user.uid)
 * Atomic: OPEN -> HELD
 */
router.post("/request", requireAuth, async (req, res) => {
  try {
    const customerUid = req.user.uid;
    const { artistUid, date, slotType, note } = req.body || {};

    if (!customerUid || !artistUid) {
      return res
        .status(400)
        .json({ success: false, message: "customerUid and artistUid required" });
    }
    if (!isValidYMD(date)) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD" });
    }
    if (!["MORNING", "EVENING"].includes(slotType)) {
      return res.status(400).json({ success: false, message: "Invalid slotType" });
    }

    // booking allowed from tomorrow onward
    const minDate = tomorrowYMD();
    if (date < minDate) {
      return res
        .status(400)
        .json({ success: false, message: `Booking allowed from ${minDate}` });
    }

    const now = new Date();
    const heldUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    // Atomic lock: only OPEN can be HELD
    const slot = await AvailabilitySlot.findOneAndUpdate(
      {
        artistUid,
        date,
        slotType,
        status: "OPEN",
      },
      {
        $set: { status: "HELD", heldUntil },
      },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({ success: false, message: "Slot not available" });
    }

    const booking = await Booking.create({
      artistUid,
      customerUid,
      date,
      slotType,
      status: "PENDING",
      note: note || "",
    });

    slot.bookingId = booking._id;
    await slot.save();

    return res.status(201).json({ success: true, data: { booking, slot } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/accept (artist)
 * booking must be PENDING
 * slot must have bookingId = booking.id
 */
router.patch("/:id/accept", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // ✅ artist must be logged in user
    if (booking.artistUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking must be PENDING" });
    }

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
    });

    if (!slot) {
      return res.status(400).json({ success: false, message: "Slot link mismatch" });
    }

    booking.status = "ACCEPTED";
    await booking.save();

    slot.status = "BOOKED";
    slot.heldUntil = null;
    await slot.save();

    return res.json({ success: true, data: { booking, slot } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/reject (artist)
 */
router.patch("/:id/reject", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // ✅ artist must be logged in user
    if (booking.artistUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking must be PENDING" });
    }

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
    });

    booking.status = "REJECTED";
    await booking.save();

    if (slot) {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.bookingId = null;
      await slot.save();
    }

    return res.json({ success: true, data: { booking } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/bookings/artist/:uid?status=PENDING
 * ✅ optional: protect so only same artist can view
 */
router.get("/artist/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

    // ✅ only self
    if (uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const query = { artistUid: uid };
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/bookings/customer/:uid?status=ACCEPTED
 * ✅ optional: protect so only same customer can view
 */
router.get("/customer/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

    // ✅ only self
    if (uid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const query = { customerUid: uid };
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/markPaid (MVP simulation)
 * Allowed only if status ACCEPTED -> CONFIRMED
 */
router.patch("/:id/markPaid", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    // ✅ customer must be logged in user
    if (booking.customerUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.status !== "ACCEPTED") {
      return res
        .status(400)
        .json({ success: false, message: "Booking must be ACCEPTED to pay" });
    }

    booking.status = "CONFIRMED";
    await booking.save();

    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;