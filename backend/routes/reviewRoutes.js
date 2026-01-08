import express from "express";
import Review from "../models/review.js";

const router = express.Router();

/**
 * GET /api/reviews/artist/:artistUid
 * returns: { summary: { avgRating, totalReviews }, reviews: [...] }
 */
router.get("/artist/:artistUid", async (req, res) => {
  try {
    const { artistUid } = req.params;

    const reviews = await Review.find({ artistUid })
      .sort({ createdAt: -1 })
      .lean();

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews === 0
        ? 0
        : Math.round(
            (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews) * 10
          ) / 10;

    res.json({
      summary: { avgRating, totalReviews },
      reviews,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
});

/**
 * POST /api/reviews
 * Create review (event planner would call this after completed booking)
 */
router.post("/", async (req, res) => {
  try {
    const {
      artistUid,
      plannerUid,
      plannerName,
      plannerPhotoURL,
      eventType,
      rating,
      comment,
      bookingId,
    } = req.body;

    if (!artistUid || !plannerUid || !plannerName || !rating) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newReview = await Review.create({
      artistUid,
      plannerUid,
      plannerName,
      plannerPhotoURL,
      eventType,
      rating,
      comment,
      bookingId: bookingId || null,
    });

    res.status(201).json(newReview);
  } catch (err) {
    res.status(500).json({ message: "Failed to create review", error: err.message });
  }
});

export default router;
