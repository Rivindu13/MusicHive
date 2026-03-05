import express from "express";
const router = express.Router();

import AvailabilitySlot from "../models/AvailabilitySlots.js";
import User from "../models/User.js";

import { SLOTS, SLOT_TIMES, DAYS_AHEAD, HOLD_MINUTES } from "../config/bookingConstants.js";
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
                  heldBy: null,
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
 * ✅ NEW
 * PATCH /api/availability/:slotId/hold   (customer clicks slot pill)
 * Rules:
 * - only OPEN slot can be held
 * - or if HELD but expired => can be held
 * - if already held by same customer => extend/refresh timer
 * - DISABLED/BOOKED/RESERVED cannot be held
 */
router.patch("/:slotId/hold", requireAuth, async (req, res) => {
  try {
    const { slotId } = req.params;
    const customerUid = req.user.uid;

    const now = new Date();
    const heldUntil = new Date(now.getTime() + HOLD_MINUTES * 60 * 1000);

    const slot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slotId,
        status: { $in: ["OPEN", "HELD"] },
        $or: [
          { status: "OPEN" },
          // expired hold can be taken
          { status: "HELD", heldUntil: { $lt: now } },
          // same customer can refresh
          { status: "HELD", heldBy: customerUid },
        ],
      },
      {
        $set: { status: "HELD", heldBy: customerUid, heldUntil },
        $setOnInsert: {},
      },
      { new: true }
    );

    if (!slot) {
      return res.status(409).json({ success: false, message: "Slot not available to hold" });
    }

    // if slot was HELD by someone else & not expired, it won't match query anyway
    return res.json({ success: true, data: slot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * ✅ OPTIONAL (recommended)
 * PATCH /api/availability/:slotId/release  (customer unselects)
 * Only releases if customer is the holder and still HELD
 */
router.patch("/:slotId/release", requireAuth, async (req, res) => {
  try {
    const { slotId } = req.params;
    const customerUid = req.user.uid;

    const slot = await AvailabilitySlot.findOneAndUpdate(
      { _id: slotId, status: "HELD", heldBy: customerUid },
      { $set: { status: "OPEN", heldBy: null, heldUntil: null } },
      { new: true }
    );

    if (!slot) {
      return res.status(404).json({ success: false, message: "No held slot to release" });
    }

    return res.json({ success: true, data: slot });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PATCH /api/availability/:slotId/toggle (artist)
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

    if (slot.artistUid !== req.user.uid) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // ✅ if held but expired, reset it
    if (slot.status === "HELD" && slot.heldUntil && slot.heldUntil < new Date()) {
      slot.status = "OPEN";
      slot.heldUntil = null;
      slot.heldBy = null;
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