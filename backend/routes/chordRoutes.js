// routes/chordRoutes.js
import express from "express";
import Chord from "../models/Chord.js"; // ✅ needed for review routes
import {
  createChord,
  getChordsByArtist,
  getChordsByCustomer,
  deleteChord,
} from "../controllers/chordController.js";

const router = express.Router();

/**
 * ✅ Create chord (artist OR customer)
 * Body: { uid, role: "ARTIST"|"CUSTOMER", title, genre, imageUrl }
 */
router.post("/", createChord);

/**
 * ✅ Get chords by artist (legacy / keep)
 * GET /api/chords/artist/:uid
 */
router.get("/artist/:uid", getChordsByArtist);

/**
 * ✅ Get chords by customer (new)
 * GET /api/chords/customer/:uid
 */
router.get("/customer/:uid", getChordsByCustomer);

/**
 * ✅ Delete chord
 * DELETE /api/chords/:id
 */
router.delete("/:id", deleteChord);

/**
 * ✅ Add a review to a chord
 * POST /api/chords/:id/reviews
 * Body: { uid, name, photoURL, rating, text }
 */
router.post("/:id/reviews", async (req, res) => {
  try {
    const { uid, name, photoURL, rating, text } = req.body;

    if (!uid || !name || rating == null) {
      return res.status(400).json({ message: "uid, name, rating required" });
    }

    const numRating = Number(rating);
    if (Number.isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const chord = await Chord.findById(req.params.id);
    if (!chord) return res.status(404).json({ message: "Chord not found" });

    // prevent same user reviewing twice (optional)
    const already = chord.reviews.find((r) => r.uid === uid);
    if (already) {
      return res.status(400).json({ message: "You already reviewed this chord" });
    }

    chord.reviews.push({
      uid,
      name,
      photoURL: photoURL || "",
      rating: numRating,
      text: text || "",
    });

    await chord.save();
    return res.json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Delete a review (only that user) - optional
 * DELETE /api/chords/:id/reviews/:reviewId
 * Body: { uid }
 */
router.delete("/:id/reviews/:reviewId", async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ message: "uid is required" });
    }

    const chord = await Chord.findById(req.params.id);
    if (!chord) return res.status(404).json({ message: "Chord not found" });

    const review = chord.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });

    if (review.uid !== uid) {
      return res.status(403).json({ message: "Not allowed" });
    }

    review.deleteOne();
    await chord.save();
    return res.json(chord);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;