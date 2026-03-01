import express from "express";
const router = express.Router();

import AvailabilitySlot from "../models/AvailabilitySlots.js";
import User from "../models/User.js";

import { SLOTS, SLOT_TIMES, DAYS_AHEAD } from "../config/bookingConstants.js";
import { addDays, toYMD } from "../utils/date.js";

// Firebase auth middleware
import { requireAuth } from "../middleware/requireAuth.js";

/**
 * POST /api/availability/ensure
 * Body: { artistUid?: string, daysAhead?: number }
 * Creates missing slots (does not overwrite existing)
 */
router.post("/ensure", async (req, res) => {
  try {
    const { artistUid, daysAhead } = req.body || {};
    const horizon = Number(daysAhead || DAYS_AHEAD);

    let artistUids = [];
    if (artistUid) {
      artistUids = [artistUid];
    } else {
      const artists = await User.find(
        { role: { $in: ["artist", "band"] } },
        { uid: 1, _id: 0 }
      ).lean();
      artistUids = artists.map((a) => a.uid);
    }

    const start = new Date();
    const startDate = addDays(start, 1); // tomorrow
    const endDate = addDays(start, horizon);

    const ops = [];
    for (const uid of artistUids) {
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const date = toYMD(d);

        for (const slotType of SLOTS) {
          const { startTime, endTime } = SLOT_TIMES[slotType];

          ops.push({
            updateOne: {
              filter: { artistUid: uid, date, slotType },
              update: {
                $setOnInsert: {
                  artistUid: uid,
                  date,
                  slotType,
                  startTime,
                  endTime,
                  status: "OPEN",
                  heldUntil: null,
                  bookingId: null,
                },
              },
              upsert: true,
            },
          });
        }
      }
    }

    if (ops.length > 0) {
      await AvailabilitySlot.bulkWrite(ops, { ordered: false });
    }

    return res.json({
      success: true,
      message: "Slots ensured",
      data: { count: ops.length },
    });
  } catch (err) {
    // Ignore duplicate key errors from bulk upsert race conditions
    if (err && err.code === 11000) {
      return res.json({
        success: true,
        message: "Slots ensured (duplicates ignored)",
      });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/availability/artist/:artistUid?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/artist/:artistUid", async (req, res) => {
  try {
    const { artistUid } = req.params;
    const { from, to } = req.query;

    const query = { artistUid };
    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = from;
      if (to) query.date.$lte = to;
    }

    const slots = await AvailabilitySlot.find(query)
      .sort({ date: 1, slotType: 1 })
      .lean();

    return res.json({ success: true, data: slots });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/availability/:slotId/toggle
 * Body: { status: "OPEN" | "DISABLED" }
 * Rules:
 * - Only owner can toggle
 * - Cannot disable if BOOKED
 * - If HELD but expired => reset to OPEN first
 */
router.patch("/:slotId/toggle", requireAuth, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { status } = req.body || {};

    if (!["OPEN", "DISABLED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const slot = await AvailabilitySlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ success: false, message: "Slot not found" });
    }

    // ✅ owner check using Firebase uid
    if (slot.artistUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // ✅ if held but expired, reset it
    if (slot.status === "HELD" && slot.heldUntil && slot.heldUntil < new Date()) {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.bookingId = null;
    }

    // cannot disable booked slot
    if (slot.status === "BOOKED" && status === "DISABLED") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot disable a booked slot" });
    }

    slot.status = status;
    await slot.save();

    return res.json({ success: true, data: slot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;