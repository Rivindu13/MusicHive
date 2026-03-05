import express from "express";
const router = express.Router();

import AvailabilitySlot from "../models/AvailabilitySlots.js";
import Booking from "../models/Booking.js";

import { BOOKING_PENDING_HOURS } from "../config/bookingConstants.js";
import { tomorrowYMD } from "../utils/date.js";

import { requireAuth } from "../middleware/requireAuth.js";

function isValidYMD(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

/**
 * ✅ UPDATED FLOW
 * POST /api/bookings/request (customer clicks "Request Booking")
 * Body: { slotId, note }
 *
 * Rules:
 * - slot must be HELD by this customer and not expired
 * - convert HELD -> RESERVED
 * - create booking PENDING with expiresAt = now + 24h
 */
router.post("/request", requireAuth, async (req, res) => {
  try {
    const customerUid = req.user.uid;
    const { slotId, note } = req.body || {};

    if (!slotId) {
      return res.status(400).json({ success: false, message: "slotId is required" });
    }

    const now = new Date();

    // 1) load slot
    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: "Slot not found" });

    // booking allowed from tomorrow onward
    const minDate = tomorrowYMD();
    if (!isValidYMD(slot.date) || slot.date < minDate) {
      return res
        .status(400)
        .json({ success: false, message: `Booking allowed from ${minDate}` });
    }

    // 2) validate hold ownership + not expired
    if (slot.status !== "HELD") {
      return res.status(409).json({ success: false, message: "Slot is not held" });
    }
    if (!slot.heldBy || slot.heldBy !== customerUid) {
      return res.status(403).json({ success: false, message: "This slot is not held by you" });
    }
    if (!slot.heldUntil || slot.heldUntil < now) {
      return res.status(409).json({ success: false, message: "Hold expired. Please select again." });
    }

    // 3) Atomic convert HELD -> RESERVED (protect against races)
    const reservedSlot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slotId,
        status: "HELD",
        heldBy: customerUid,
        heldUntil: { $gt: now },
      },
      {
        $set: {
          status: "RESERVED",
          heldUntil: null,
          // keep heldBy optional; but cleaner to clear it now
          heldBy: null,
        },
      },
      { new: true }
    );

    if (!reservedSlot) {
      return res.status(409).json({ success: false, message: "Slot could not be reserved" });
    }

    const expiresAt = new Date(now.getTime() + BOOKING_PENDING_HOURS * 60 * 60 * 1000);

    // 4) create booking
    const booking = await Booking.create({
      artistUid: reservedSlot.artistUid,
      customerUid,
      date: reservedSlot.date,
      slotType: reservedSlot.slotType,
      status: "PENDING",
      note: note || "",
      expiresAt,
    });

    // 5) link slot -> booking
    reservedSlot.bookingId = booking._id;
    await reservedSlot.save();

    return res.status(201).json({ success: true, data: { booking, slot: reservedSlot } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/accept (artist)
 * booking must be PENDING (and not expired)
 * slot must be RESERVED with bookingId
 */
router.patch("/:id/accept", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.artistUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (booking.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Booking must be PENDING" });
    }

    // optional safety: prevent accepting already expired
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      booking.status = "EXPIRED";
      await booking.save();
      return res.status(409).json({ success: false, message: "Booking request expired" });
    }

    const slot = await AvailabilitySlot.findOne({
      artistUid: booking.artistUid,
      date: booking.date,
      slotType: booking.slotType,
      bookingId: booking._id,
      status: "RESERVED",
    });

    if (!slot) {
      return res.status(400).json({ success: false, message: "Slot link mismatch" });
    }

    booking.status = "ACCEPTED";
    await booking.save();

    slot.status = "BOOKED";
    slot.heldUntil = null;
    slot.heldBy = null;
    await slot.save();

    return res.json({ success: true, data: { booking, slot } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/bookings/:id/reject (artist)
 * booking must be PENDING
 * slot RESERVED -> OPEN
 */
router.patch("/:id/reject", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

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
      slot.heldBy = null;
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
 */
router.get("/artist/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

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
 */
router.get("/customer/:uid", requireAuth, async (req, res) => {
  try {
    const { uid } = req.params;
    const { status } = req.query;

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

    // optional: accept paymentRef/amountPaid from body (for future gateway)
    const { paymentRef, amountPaid } = req.body || {};

    booking.status = "CONFIRMED";
    booking.paymentStatus = "PAID";
    booking.paidAt = new Date();
    booking.paymentRef = paymentRef || booking.paymentRef || "";
    booking.amountPaid =
      typeof amountPaid === "number" ? amountPaid : booking.amountPaid ?? booking.price ?? null;

    await booking.save();

    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;