import express from "express";
import Report from "../models/report.js";
import Booking from "../models/Booking.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

function isPastBookingDate(ymd) {
  if (!ymd) return false;

  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [year, month, day] = String(ymd).split("-").map(Number);
  const bookingDay = new Date(year, month - 1, day);

  return bookingDay < localToday;
}

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      bookingId,
      reporterUid,
      reporterName,
      reporterRole,
      reportedUid,
      reportedName,
      reportedRole,
      reason,
      description,
      evidenceUrls,
    } = req.body || {};

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "bookingId is required",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.customerUid !== req.user.uid && booking.artistUid !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (!isPastBookingDate(booking.date)) {
      return res.status(400).json({
        success: false,
        message: "You can report only after the booking date has passed",
      });
    }

    const existingReport = await Report.findOne({
      bookingId,
      reporterUid: req.user.uid,
    });

    if (existingReport) {
      return res.status(409).json({
        success: false,
        message: "You have already reported this booking",
      });
    }

    const report = await Report.create({
      bookingId,
      reporterUid: reporterUid || req.user.uid,
      reporterName: reporterName || "",
      reporterRole,
      reportedUid,
      reportedName: reportedName || "",
      reportedRole,
      reason,
      description,
      evidenceUrls: Array.isArray(evidenceUrls) ? evidenceUrls : [],
    });

    res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to submit report",
      error: err.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("bookingId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reports",
      error: err.message,
    });
  }
});

export default router;