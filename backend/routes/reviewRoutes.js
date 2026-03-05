import express from "express";
import Review from "../models/review.js";
import Booking from "../models/Booking.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

function computeSummary(reviews) {
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews === 0
      ? 0
      : Math.round(
          (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews) * 10
        ) / 10;

  return { avgRating, totalReviews };
}

/**
 * ✅ Backward compatible:
 * GET /api/reviews/artist/:artistUid
 * returns: { summary: { avgRating, totalReviews }, reviews: [...] }
 */
router.get("/artist/:artistUid", async (req, res) => {
  try {
    const { artistUid } = req.params;

    const reviews = await Review.find({
      revieweeUid: artistUid,
      revieweeRole: "ARTIST",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      summary: computeSummary(reviews),
      reviews,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

/**
 * ✅ Generic:
 * GET /api/reviews/user/:uid?role=ARTIST|CUSTOMER
 */
router.get("/user/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const { role } = req.query;

    const q = { revieweeUid: uid };
    if (role && ["ARTIST", "CUSTOMER"].includes(String(role).toUpperCase())) {
      q.revieweeRole = String(role).toUpperCase();
    }

    const reviews = await Review.find(q).sort({ createdAt: -1 }).lean();
    return res.json({ summary: computeSummary(reviews), reviews });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

/**
 * ✅ POST /api/reviews
 * Only allowed if booking is CONFIRMED + PAID.
 *
 * Body: { bookingId, rating, comment, eventType?, reviewerName, reviewerPhotoURL? }
 *
 * Who can post:
 * - customer can review artist
 * - artist can review customer
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const reviewerUid = req.user.uid;

    const {
      bookingId,
      rating,
      comment,
      eventType,
      reviewerName,
      reviewerPhotoURL,
    } = req.body || {};

    if (!bookingId || !reviewerName || typeof rating !== "number") {
      return res.status(400).json({ message: "bookingId, reviewerName, and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ must be completed + paid
    if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PAID") {
      return res.status(400).json({
        message: "You can review only after the booking is confirmed and paid",
      });
    }

    const isCustomer = booking.customerUid === reviewerUid;
    const isArtist = booking.artistUid === reviewerUid;

    if (!isCustomer && !isArtist) {
      return res.status(403).json({ message: "You are not part of this booking" });
    }

    const reviewerRole = isCustomer ? "CUSTOMER" : "ARTIST";
    const revieweeRole = isCustomer ? "ARTIST" : "CUSTOMER";
    const revieweeUid = isCustomer ? booking.artistUid : booking.customerUid;

    // ✅ Create review (unique index prevents duplicates)
    const newReview = await Review.create({
      bookingId,
      reviewerUid,
      reviewerRole,
      revieweeUid,
      revieweeRole,
      reviewerName,
      reviewerPhotoURL: reviewerPhotoURL || null,
      eventType: eventType || "Event",
      rating,
      comment: comment || "",
    });

    return res.status(201).json(newReview);
  } catch (err) {
    // duplicate (already reviewed)
    if (err?.code === 11000) {
      return res.status(409).json({ message: "You already reviewed this booking" });
    }
    return res.status(500).json({ message: "Failed to create review", error: err.message });
  }
});

export default router;